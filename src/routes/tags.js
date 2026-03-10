/**
 * 标签 API 路由
 */

const express = require('express');
const router = express.Router();
const db = require('../models/database');

// 获取所有标签（默认只返回已审核的）
router.get('/', (req, res) => {
  try {
    const approvedOnly = req.query.approved !== 'false';
    const tags = db.getAllTags(approvedOnly);
    res.json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// 申请新标签（无需登录，但需要审核）
router.post('/apply', (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '标签名称不能为空' });
    }

    const applicantIp = req.ip || req.connection.remoteAddress;
    const result = db.createApplication(name.trim(), color || '#3b82f6', applicantIp);
    
    res.status(201).json({ 
      success: true, 
      message: '标签申请已提交，等待管理员审核',
      applicationId: result.lastInsertRowid
    });
  } catch (error) {
    console.error('Error applying for tag:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: '该标签已存在' });
    }
    res.status(500).json({ error: '申请失败：' + error.message });
  }
});

// 添加标签（需要认证 - 管理员直接添加）
router.post('/', (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const result = db.addTag(name, color || '#3b82f6', 1);
    res.status(201).json({ 
      success: true, 
      message: 'Tag added successfully' 
    });
  } catch (error) {
    console.error('Error adding tag:', error);
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: '该标签已存在' });
    }
    res.status(500).json({ error: 'Failed to add tag' });
  }
});

// 删除标签（需要认证）
router.delete('/:id', (req, res) => {
  try {
    const result = db.deleteTag(req.params.id);
    if (result.changes === 0) {
      return res.status(404).json({ error: 'Tag not found' });
    }
    res.json({ success: true, message: 'Tag deleted successfully' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

module.exports = router;
