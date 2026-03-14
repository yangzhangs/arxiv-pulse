/**
 * 标签管理 API 路由
 */

const express = require('express');
const router = express.Router();
const db = require('../models/database');

// 获取所有标签
router.get('/tags', (req, res) => {
  try {
    const tags = db.db.prepare(`
      SELECT id, name, color, created_at, is_approved
      FROM tags
      ORDER BY created_at DESC
    `).all();
    
    res.json({ success: true, tags });
  } catch (error) {
    console.error('Error fetching tags:', error);
    res.status(500).json({ error: 'Failed to fetch tags' });
  }
});

// 创建新标签
router.post('/tags', (req, res) => {
  try {
    const { name, color } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '标签名称不能为空' });
    }
    
    // 检查是否已存在
    const existing = db.db.prepare('SELECT id FROM tags WHERE name = ?').get(name.trim());
    if (existing) {
      return res.status(400).json({ error: '标签名称已存在' });
    }
    
    const tagColor = color || '#3b82f6';
    const result = db.db.prepare(`
      INSERT INTO tags (name, color, is_approved)
      VALUES (?, ?, 1)
    `).run(name.trim(), tagColor);
    
    const newTag = db.db.prepare(`
      SELECT id, name, color, created_at, is_approved
      FROM tags
      WHERE id = ?
    `).get(result.lastInsertRowid);
    
    res.status(201).json({ 
      success: true, 
      message: '标签创建成功',
      tag: newTag
    });
  } catch (error) {
    console.error('Error creating tag:', error);
    res.status(500).json({ error: 'Failed to create tag' });
  }
});

// 更新标签
router.put('/tags/:id', (req, res) => {
  try {
    const { id } = req.params;
    const { name, color, is_approved } = req.body;
    
    if (!name || !name.trim()) {
      return res.status(400).json({ error: '标签名称不能为空' });
    }
    
    // 检查标签是否存在
    const existing = db.db.prepare('SELECT id FROM tags WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: '标签不存在' });
    }
    
    // 检查新名称是否与其他标签重复
    const duplicate = db.db.prepare('SELECT id FROM tags WHERE name = ? AND id != ?').get(name.trim(), id);
    if (duplicate) {
      return res.status(400).json({ error: '标签名称已存在' });
    }
    
    db.db.prepare(`
      UPDATE tags 
      SET name = ?, color = ?, is_approved = ?
      WHERE id = ?
    `).run(name.trim(), color || '#3b82f6', is_approved !== undefined ? is_approved : 1, id);
    
    const updatedTag = db.db.prepare(`
      SELECT id, name, color, created_at, is_approved
      FROM tags
      WHERE id = ?
    `).get(id);
    
    res.json({ 
      success: true, 
      message: '标签更新成功',
      tag: updatedTag
    });
  } catch (error) {
    console.error('Error updating tag:', error);
    res.status(500).json({ error: 'Failed to update tag' });
  }
});

// 删除标签
router.delete('/tags/:id', (req, res) => {
  try {
    const { id } = req.params;
    
    // 检查标签是否存在
    const existing = db.db.prepare('SELECT id FROM tags WHERE id = ?').get(id);
    if (!existing) {
      return res.status(404).json({ error: '标签不存在' });
    }
    
    // 检查是否有论文关联此标签
    const paperCount = db.db.prepare('SELECT COUNT(*) as count FROM paper_tags WHERE tag_id = ?').get(id).count;
    if (paperCount > 0) {
      return res.status(400).json({ 
        error: `无法删除标签，仍有 ${paperCount} 篇论文使用该标签` 
      });
    }
    
    db.db.prepare('DELETE FROM tags WHERE id = ?').run(id);
    
    res.json({ success: true, message: '标签删除成功' });
  } catch (error) {
    console.error('Error deleting tag:', error);
    res.status(500).json({ error: 'Failed to delete tag' });
  }
});

module.exports = router;
