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
const cookieParser = require('cookie-parser');
require('dotenv').config();

// 国际化配置
const i18n = require('./config/i18n');

const app = express();
const PORT = process.env.PORT || 3000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// 国际化中间件
const i18nMiddleware = require('./middleware/i18n');
app.use(i18nMiddleware);

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

// 语言切换 API
app.get('/api/set-lang', (req, res) => {
  const lang = req.query.lang;
  if (lang && (lang === 'zh' || lang === 'en')) {
    res.cookie('lang', lang, { maxAge: 365 * 24 * 60 * 60 * 1000, httpOnly: false });
    res.json({ success: true, lang });
  } else {
    res.status(400).json({ error: 'Invalid language' });
  }
});

// 获取翻译 API
app.get('/api/i18n', (req, res) => {
  const lang = req.query.lang || 'zh';
  if (i18n[lang]) {
    res.json({ lang, translations: i18n[lang] });
  } else {
    res.status(400).json({ error: 'Invalid language' });
  }
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
