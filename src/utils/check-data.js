/**
 * 检查当前数据库状态
 */

const db = require('../models/database');

console.log('📊 数据库状态检查\n');

// 1. 论文总数
const totalPapers = db.db.prepare('SELECT COUNT(*) as count FROM papers').get().count;
console.log(`📄 论文总数：${totalPapers}`);

// 2. 按日期统计
const dateStats = db.db.prepare(`
  SELECT DATE(published_date) as date, COUNT(*) as count 
  FROM papers 
  GROUP BY DATE(published_date) 
  ORDER BY date DESC 
  LIMIT 10
`).all();

console.log('\n📅 最近 10 天的论文数量:');
dateStats.forEach(row => {
  console.log(`   ${row.date}: ${row.count} 篇`);
});

// 3. 检查作者为 unknown 的论文
const unknownAuthors = db.db.prepare(`
  SELECT COUNT(*) as count FROM papers 
  WHERE authors = 'unknown' OR authors IS NULL OR authors = ''
`).get().count;

console.log(`\n⚠️ 作者信息为 unknown/空的论文：${unknownAuthors} 篇`);

// 4. 查看几篇示例数据
const samples = db.db.prepare(`
  SELECT arxiv_id, title, authors, abstract, published_date 
  FROM papers 
  ORDER BY published_date DESC 
  LIMIT 3
`).all();

console.log('\n📝 最新 3 篇论文示例:');
samples.forEach((paper, i) => {
  console.log(`\n   [${i+1}] ${paper.title}`);
  console.log(`       作者：${paper.authors}`);
  console.log(`       日期：${paper.published_date}`);
  console.log(`       摘要：${paper.abstract?.substring(0, 100)}...`);
});

// 5. 标签统计
const totalTags = db.db.prepare('SELECT COUNT(*) as count FROM tags WHERE is_approved = 1').get().count;
console.log(`\n🏷️ 已审核标签数量：${totalTags}`);

// 6. 2026-03-09 之前的论文数量
const beforeMarch9 = db.db.prepare(`
  SELECT COUNT(*) as count FROM papers 
  WHERE DATE(published_date) < '2026-03-09'
`).get().count;

console.log(`\n🗑️ 2026-03-09 之前的论文：${beforeMarch9} 篇`);

console.log('\n✅ 检查完成\n');
