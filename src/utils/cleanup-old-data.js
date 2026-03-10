/**
 * 删除 2026-03-09 之前的论文数据
 */

const db = require('../models/database');

console.log('🗑️ 开始删除旧数据...\n');

// 删除 2026-03-09 之前的论文
const deleteStmt = db.db.prepare(`
  DELETE FROM papers 
  WHERE DATE(published_date) < '2026-03-09'
`);

const result = deleteStmt.run();

console.log(`✅ 已删除 ${result.changes} 篇论文`);

// 清理孤立的 paper_tags 记录
const cleanupStmt = db.db.prepare(`
  DELETE FROM paper_tags 
  WHERE paper_id NOT IN (SELECT id FROM papers)
`);

const cleanupResult = cleanupStmt.run();
console.log(`✅ 已清理 ${cleanupResult.changes} 条孤立的标签关联记录`);

// 验证剩余数据
const remaining = db.db.prepare('SELECT COUNT(*) as count FROM papers').get().count;
console.log(`\n📊 剩余论文总数：${remaining}`);

// 显示剩余论文的日期分布
const dateStats = db.db.prepare(`
  SELECT DATE(published_date) as date, COUNT(*) as count 
  FROM papers 
  GROUP BY DATE(published_date) 
  ORDER BY date DESC
`).all();

console.log('\n📅 剩余论文按日期分布:');
dateStats.forEach(row => {
  console.log(`   ${row.date}: ${row.count} 篇`);
});

console.log('\n✅ 数据清理完成\n');
