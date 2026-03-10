/**
 * 修复摘要中的重复前缀问题
 */

const db = require('../models/database');

console.log('🔧 修复摘要前缀...\n');

const papers = db.db.prepare('SELECT id, abstract FROM papers WHERE abstract LIKE ?').all('%[中文摘要] [英文摘要]%');

let fixed = 0;

papers.forEach(paper => {
  const newAbstract = paper.abstract.replace('[中文摘要] [英文摘要]', '[中文摘要]');
  
  db.db.prepare('UPDATE papers SET abstract = ? WHERE id = ?').run(newAbstract, paper.id);
  fixed++;
});

console.log(`✅ 已修复 ${fixed} 篇论文的摘要前缀\n`);

// 显示修复后的示例
const samples = db.db.prepare('SELECT id, title, abstract FROM papers LIMIT 3').all();
console.log('📝 修复后示例:\n');
samples.forEach((paper, i) => {
  console.log(`${i+1}. ${paper.title.substring(0, 60)}...`);
  console.log(`   摘要：${paper.abstract.substring(0, 100)}...\n`);
});
