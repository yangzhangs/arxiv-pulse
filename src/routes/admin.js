/**
 * 管理后台 API 路由
 * 注意：生产环境需要添加认证中间件
 */

const express = require('express');
const router = express.Router();
const db = require('../models/database');

// 简单的令牌验证中间件（生产环境应使用更安全的方案）
const verifyToken = (req, res, next) => {
  const token = req.headers['x-admin-token'];
  const expectedToken = process.env.ADMIN_TOKEN;
  
  if (!expectedToken) {
    // 如果没有设置 ADMIN_TOKEN，允许访问（仅开发环境）
    return next();
  }
  
  if (token !== expectedToken) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
};

// 获取统计数据
router.get('/stats', verifyToken, (req, res) => {
  try {
    const totalPapers = db.db.prepare('SELECT COUNT(*) as count FROM papers').get().count;
    const totalTags = db.db.prepare('SELECT COUNT(*) as count FROM tags').get().count;
    const recentPapers = db.db.prepare(`
      SELECT COUNT(*) as count FROM papers 
      WHERE created_at >= datetime('now', '-7 days')
    `).get().count;

    res.json({
      totalPapers,
      totalTags,
      recentPapers,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error fetching stats:', error);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// 批量导入论文
router.post('/import', verifyToken, (req, res) => {
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
router.delete('/cleanup', verifyToken, (req, res) => {
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
