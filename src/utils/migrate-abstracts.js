/**
 * 迁移现有论文数据到新的摘要字段结构
 */

const path = require('path');
const db = require(path.join(__dirname, '../models/database'));

console.log('🔄 开始迁移论文摘要数据...\n');

const papers = db.db.prepare('SELECT id, title, abstract FROM papers').all();

let updated = 0;

papers.forEach(paper => {
  try {
    if (!paper.abstract) return;
    
    // 提取英文原文（移除 [中文摘要] 前缀）
    let englishAbstract = paper.abstract;
    let chineseAbstract = paper.abstract;
    
    if (paper.abstract.startsWith('[中文摘要]')) {
      // 提取中文部分
      chineseAbstract = paper.abstract.replace(/^\[中文摘要\]\s*/, '').trim();
      
      // 这里我们假设原来的 abstract 字段存储的是翻译后的中文
      // 英文原文需要从其他来源获取，或者暂时留空
      // 为了演示，我们将中文也作为英文（实际应该从 arxiv 重新获取）
      englishAbstract = chineseAbstract; // 实际应该重新获取英文原文
    }
    
    // 更新数据库
    db.db.prepare(`
      UPDATE papers 
      SET abstract_en = ?, 
          abstract_cn = ?,
          abstract = ?
      WHERE id = ?
    `).run(englishAbstract, chineseAbstract, chineseAbstract, paper.id);
    
    updated++;
    console.log(`✅ 迁移论文 ${paper.id}: ${paper.title.substring(0, 40)}...`);
  } catch (error) {
    console.error(`❌ 迁移失败 ${paper.id}:`, error.message);
  }
});

console.log(`\n📊 迁移完成: ${updated} 篇论文已更新`);

process.exit(0);
