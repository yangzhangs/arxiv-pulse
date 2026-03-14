/**
 * ArxivPulse - Arxiv 学术文章展示平台
 * 
 * 一个简洁美观的学术文章展示网站，每日自动同步最新 Software Engineering 领域论文
 * 
 * @author yangzhangs
 * @license MIT
 */

const express = require('express');
const path = require('path');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 静态文件
app.use(express.static(path.join(__dirname, '../public')));

// 路由
const papersRouter = require('./routes/papers');
const tagsRouter = require('./routes/tags');
const adminRouter = require('./routes/admin');
const tagsAdminRouter = require('./routes/tags-admin');

// API 路由 - 支持两种路径：/api/* 和 /arxiv-pulse/api/*
app.use('/api/papers', papersRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/tags-admin', tagsAdminRouter);

// 兼容 nginx 反向代理路径 /arxiv-pulse/api/*
app.use('/arxiv-pulse/api/papers', papersRouter);
app.use('/arxiv-pulse/api/tags', tagsRouter);
app.use('/arxiv-pulse/api/admin', adminRouter);
app.use('/arxiv-pulse/api/tags-admin', tagsAdminRouter);

// 页面路由
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

app.get('/tags', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/tags.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/about.html'));
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin.html'));
});

// 兼容 nginx 反向代理路径 /arxiv-pulse/*
app.get('/arxiv-pulse', (req, res) => {
  res.redirect(301, '/arxiv-pulse/');
});

app.get('/arxiv-pulse/', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/index.html'));
});

app.get('/arxiv-pulse/tags', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/tags.html'));
});

app.get('/arxiv-pulse/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../views/admin.html'));
});

// 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, '../views/404.html'));
});

// 错误处理
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 启动服务器
app.listen(PORT, '127.0.0.1', () => {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   📚 ArxivPulse - Academic Paper Showcase Platform    ║
║                                                        ║
║   Server running at: http://127.0.0.1:${PORT}           ║
║   Public URL: https://www.reset-group.site/arxiv-papers ║
║                                                        ║
║   Admin Panel: http://127.0.0.1:${PORT}/admin          ║
║   Default Admin: admin / admin123                      ║
║                                                        ║
║   Status: ✅ Ready                                     ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
});

module.exports = app;
