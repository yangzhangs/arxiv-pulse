/**
 * 论文 API 路由
 */

const express = require('express');
const router = express.Router();
const db = require('../models/database');

// 获取所有论文
router.get('/', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = db.getAllPapers(page, limit);
    res.json(result);
  } catch (error) {
    console.error('Error fetching papers:', error);
    res.status(500).json({ error: 'Failed to fetch papers' });
  }
});

// 获取单篇论文
router.get('/:id', (req, res) => {
  try {
    const paper = db.getPaperById(req.params.id);
    if (!paper) {
      return res.status(404).json({ error: 'Paper not found' });
    }
    res.json(paper);
  } catch (error) {
    console.error('Error fetching paper:', error);
    res.status(500).json({ error: 'Failed to fetch paper' });
  }
});

// 按标签筛选
router.get('/tag/:tagName', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = db.getPapersByTag(req.params.tagName, page, limit);
    res.json(result);
  } catch (error) {
    console.error('Error fetching papers by tag:', error);
    res.status(500).json({ error: 'Failed to fetch papers' });
  }
});

// 搜索论文
router.get('/search/:query', (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const result = db.searchPapers(req.params.query, page, limit);
    res.json(result);
  } catch (error) {
    console.error('Error searching papers:', error);
    res.status(500).json({ error: 'Failed to search papers' });
  }
});

// 添加论文（需要认证）
router.post('/', (req, res) => {
  try {
    const { arxiv_id, title, authors, abstract, pdf_url, arxiv_url, published_date, submitted_date, comment, accepted_venue, tags } = req.body;
    
    if (!arxiv_id || !title || !authors || !published_date) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = db.addPaper({
      arxiv_id,
      title,
      authors,
      abstract,
      pdf_url,
      arxiv_url,
      published_date,
      submitted_date,
      comment,
      accepted_venue
    });

    // 添加标签
    if (tags && Array.isArray(tags)) {
      tags.forEach(tag => db.addPaperTag(result.lastInsertRowid, tag));
    }

    res.status(201).json({ 
      success: true, 
      id: result.lastInsertRowid,
      message: 'Paper added successfully' 
    });
  } catch (error) {
    console.error('Error adding paper:', error);
    res.status(500).json({ error: 'Failed to add paper' });
  }
});

module.exports = router;
