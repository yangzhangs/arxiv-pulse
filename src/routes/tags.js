/**
 * 标签 API 路由
 */

const express = require('express');
const router = express.Router();
const db = require('../models/database');

// 获取所有标签
router.get('/', (req, res) => {
  try {
    const tags = db.getAllTags();
    res.json({ tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// 添加标签（需要认证）
router.post('/', (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Tag name is required' });
    }

    const result = db.addTag(name, color || '#3b82f6');
    res.status(201).json({ 
      success: true, 
      message: 'Tag added successfully' 
    });
  } catch (error) {
    console.error('Error adding tag:', error);
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
