/**
 * 管理后台 API 路由
 */

const express = require('express');
const router = express.Router();
const db = require('../models/database');
const bcrypt = require('bcryptjs');

// 简单的会话存储（生产环境应使用 Redis 或其他持久化方案）
const sessions = new Map();

// 管理员认证中间件
const requireAdmin = (req, res, next) => {
  const sessionId = req.headers['x-session-id'];
  
  if (!sessionId || !sessions.has(sessionId)) {
    return res.status(401).json({ error: '未授权访问' });
  }
  
  const session = sessions.get(sessionId);
  if (Date.now() > session.expiresAt) {
    sessions.delete(sessionId);
    return res.status(401).json({ error: '会话已过期' });
  }
  
  req.admin = session.admin;
  next();
};

// 管理员登录
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: '用户名和密码不能为空' });
    }

    const admin = db.getAdminByUsername(username);
    if (!admin) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    const validPassword = await bcrypt.compare(password, admin.password_hash);
    if (!validPassword) {
      return res.status(401).json({ error: '用户名或密码错误' });
    }

    // 创建会话
    const sessionId = Math.random().toString(36).substring(2) + Date.now().toString(36);
    const expiresAt = Date.now() + (24 * 60 * 60 * 1000); // 24 小时过期
    
    sessions.set(sessionId, {
      admin: { id: admin.id, username: admin.username },
      expiresAt
    });

    // 更新最后登录时间
    db.updateAdminLastLogin(admin.id);

    res.json({
      success: true,
      sessionId,
      admin: { id: admin.id, username: admin.username }
    });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).json({ error: '登录失败：' + error.message });
  }
});

// 管理员登出
router.post('/logout', (req, res) => {
  const sessionId = req.headers['x-session-id'];
  if (sessionId && sessions.has(sessionId)) {
    sessions.delete(sessionId);
  }
  res.json({ success: true, message: '已登出' });
});

// 获取统计数据
router.get('/stats', requireAdmin, (req, res) => {
  try {
    const totalPapers = db.db.prepare('SELECT COUNT(*) as count FROM papers').get().count;
    const totalTags = db.db.prepare('SELECT COUNT(*) as count FROM tags WHERE is_approved = 1').get().count;
    const pendingApplications = db.db.prepare('SELECT COUNT(*) as count FROM tag_applications WHERE status = ?').get('pending').count;
    const recentPapers = db.db.prepare(`
      SELECT COUNT(*) as count FROM papers 
      WHERE created_at >= datetime('now', '-7 days')
    `).get().count;

    res.json({
      totalPapers,
      totalTags,
      pendingApplications,
      recentPapers,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// 获取所有标签申请
router.get('/applications', requireAdmin, (req, res) => {
  try {
    const status = req.query.status || 'all';
    const applications = db.getAllApplications(status);
    res.json({ applications });
  } catch (error) {
    console.error('Error fetching applications:', error);
    res.status(500).json({ error: 'Failed to fetch applications' });
  }
});

// 审核标签申请
router.post('/applications/:id/review', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const { approved } = req.body;
    
    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: '必须指定审核结果' });
    }

    const reviewerIp = req.ip || req.connection.remoteAddress;
    const result = db.reviewApplication(id, approved, reviewerIp);
    
    if (!result) {
      return res.status(404).json({ error: '申请不存在' });
    }

    res.json({
      success: true,
      message: approved ? '标签已通过审核' : '标签已拒绝',
      ...result
    });
  } catch (error) {
    console.error('Error reviewing application:', error);
    res.status(500).json({ error: '审核失败：' + error.message });
  }
});

// 删除标签申请
router.delete('/applications/:id', requireAdmin, (req, res) => {
  try {
    const { id } = req.params;
    const result = db.deleteApplication(id);
    
    if (result.changes === 0) {
      return res.status(404).json({ error: '申请不存在' });
    }
    
    res.json({ success: true, message: '申请已删除' });
  } catch (error) {
    console.error('Error deleting application:', error);
    res.status(500).json({ error: '删除失败：' + error.message });
  }
});

// 批量导入论文
router.post('/import', requireAdmin, (req, res) => {
  try {
    const { papers } = req.body;
    
    if (!Array.isArray(papers)) {
      return res.status(400).json({ error: 'papers must be an array' });
    }

    let imported = 0;
    let skipped = 0;

    papers.forEach(paper => {
      try {
        const result = db.addPaper(paper);
        if (result.changes > 0) {
          imported++;
          // 添加标签
          if (paper.tags && Array.isArray(paper.tags)) {
            paper.tags.forEach(tag => db.addPaperTag(result.lastInsertRowid, tag));
          }
        } else {
          skipped++;
        }
      } catch (error) {
        console.error('Error importing paper:', paper.arxiv_id, error);
        skipped++;
      }
    });

    res.json({
      success: true,
      imported,
      skipped,
      message: `Imported ${imported} papers, skipped ${skipped}`
    });
  } catch (error) {
    console.error('Error importing papers:', error);
    res.status(500).json({ error: 'Failed to import papers' });
  }
});

// 清理旧数据
router.delete('/cleanup', requireAdmin, (req, res) => {
  try {
    const { days } = req.query;
    const daysToKeep = parseInt(days) || 365;
    
    const result = db.db.prepare(`
      DELETE FROM papers 
      WHERE published_date < date('now', ? || ' days')
    `).run(`-${daysToKeep}`);

    res.json({
      success: true,
      deleted: result.changes,
      message: `Deleted ${result.changes} papers older than ${daysToKeep} days`
    });
  } catch (error) {
    console.error('Error cleaning up:', error);
    res.status(500).json({ error: 'Failed to cleanup' });
  }
});

module.exports = router;
