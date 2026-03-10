/**
 * 迁移摘要数据 - 分离英文原文和中文翻译
 * 格式：[EN] 英文摘要\n[CN] 中文翻译
 */

const db = require('../models/database');

console.log('🔄 迁移摘要数据...\n');

// 获取所有论文
const papers = db.db.prepare('SELECT id, abstract FROM papers').all();

let updated = 0;

papers.forEach(paper => {
  let abstract = paper.abstract;
  
  // 如果当前是 [中文摘要] 格式，需要恢复英文原文
  if (abstract.startsWith('[中文摘要]')) {
    // 由于已经丢失了英文原文，我们暂时用占位符
    // 实际应该从原始数据源重新获取
    const chineseText = abstract.replace('[中文摘要]', '').trim();
    
    // 创建新的双行格式
    const newAbstract = `[EN] Abstract text in English...\n\n[CN] ${chineseText}`;
    
    db.db.prepare('UPDATE papers SET abstract = ? WHERE id = ?').run(newAbstract, paper.id);
    updated++;
  } else if (!abstract.includes('[EN]') && !abstract.includes('[CN]')) {
    // 如果是纯英文摘要，添加格式标记
    const newAbstract = `[EN] ${abstract}\n\n[CN] 中文翻译待补充...`;
    
    db.db.prepare('UPDATE papers SET abstract = ? WHERE id = ?').run(newAbstract, paper.id);
    updated++;
  }
});

console.log(`✅ 已更新 ${updated} 篇论文的摘要格式\n`);

// 显示示例
const samples = db.db.prepare('SELECT id, title, abstract FROM papers LIMIT 2').all();
console.log('📝 新格式示例:\n');
samples.forEach((paper, i) => {
  console.log(`${i+1}. ${paper.title.substring(0, 60)}...`);
  console.log(`   摘要:\n${paper.abstract.split('\n').map(line => '   ' + line).join('\n')}\n`);
});
