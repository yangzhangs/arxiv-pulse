/**
 * 显示保留的 3 篇论文详情
 */

const db = require('../models/database');

console.log('════════════════════════════════════════════════════════');
console.log('           保留论文明细');
console.log('════════════════════════════════════════════════════════\n');

const papers = db.db.prepare(`
  SELECT id, arxiv_id, title, authors, published_date
  FROM papers
  ORDER BY published_date DESC
`).all();

console.log(`📄 保留论文数：${papers.length}\n`);

papers.forEach((paper, idx) => {
  console.log(`${idx + 1}. ${paper.title}`);
  console.log(`   Arxiv ID: ${paper.arxiv_id}`);
  console.log(`   作者：${paper.authors}`);
  console.log(`   发布日期：${paper.published_date}`);
  console.log('');
});

console.log('════════════════════════════════════════════════════════\n');
