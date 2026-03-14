/**
 * 检查论文 URL 数据
 */

const db = require('../models/database');

console.log('🔍 检查论文 URL 数据...\n');

// 获取前 5 篇论文
const papers = db.db.prepare(`
  SELECT id, title, pdf_url, arxiv_url, published_date
  FROM papers
  ORDER BY published_date DESC
  LIMIT 5
`).all();

console.log('📄 前 5 篇论文的 URL:\n');

papers.forEach((paper, idx) => {
  console.log(`${idx + 1}. ${paper.title.substring(0, 50)}...`);
  console.log(`   PDF URL: ${paper.pdf_url || '❌ 空值'}`);
  console.log(`   Arxiv URL: ${paper.arxiv_url || '❌ 空值'}`);
  console.log(`   发布日期：${paper.published_date}`);
  console.log('');
});

// 检查是否有空 URL
const papersWithoutPdf = db.db.prepare(`
  SELECT COUNT(*) as count FROM papers WHERE pdf_url IS NULL OR pdf_url = ''
`).get();

const papersWithoutArxiv = db.db.prepare(`
  SELECT COUNT(*) as count FROM papers WHERE arxiv_url IS NULL OR arxiv_url = ''
`).get();

console.log('📊 统计:');
console.log(`   PDF URL 缺失：${papersWithoutPdf.count} 篇`);
console.log(`   Arxiv URL 缺失：${papersWithoutArxiv.count} 篇`);
console.log('');
