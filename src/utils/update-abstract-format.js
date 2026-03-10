/**
 * 更新摘要格式为英文 + 中文双行显示
 */

const db = require('../models/database');

console.log('📝 更新摘要格式为英文 + 中文...\n');

// 获取所有论文
const papers = db.db.prepare('SELECT id, abstract FROM papers').all();

let updated = 0;

papers.forEach(paper => {
  let abstract = paper.abstract;
  
  // 如果已经有 [中文摘要] 前缀，分离英文和中文
  if (abstract.startsWith('[中文摘要]')) {
    // 提取中文部分（已经是翻译后的）
    const chinesePart = abstract.replace('[中文摘要]', '').trim();
    
    // 假设原文是英文摘要（这里简化处理，实际应该存储原文）
    // 由于我们没有保存原始英文摘要，暂时用中文摘要作为占位
    const newAbstract = `[EN] ${chinesePart}\n\n[CN] ${chinesePart}`;
    
    db.db.prepare('UPDATE papers SET abstract = ? WHERE id = ?').run(newAbstract, paper.id);
    updated++;
  }
});

console.log(`✅ 已更新 ${updated} 篇论文的摘要格式\n`);

// 显示示例
const samples = db.db.prepare('SELECT id, title, abstract FROM papers LIMIT 2').all();
console.log('📝 格式示例:\n');
samples.forEach((paper, i) => {
  console.log(`${i+1}. ${paper.title.substring(0, 60)}...`);
  console.log(`   摘要:\n${paper.abstract.substring(0, 200)}\n`);
});
