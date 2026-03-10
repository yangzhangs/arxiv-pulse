/**
 * 严格的标签过滤 - 只保留标题或摘要中明确提及的标签
 */

const db = require('../models/database');

console.log('🔍 开始严格过滤标签...\n');

// 获取所有论文
const papers = db.db.prepare('SELECT id, title, abstract FROM papers').all();

let totalTags = 0;
let removedTags = 0;

papers.forEach(paper => {
  // 获取该论文的所有标签
  const currentTags = db.db.prepare(`
    SELECT t.id, t.name FROM tags t
    INNER JOIN paper_tags pt ON t.id = pt.tag_id
    WHERE pt.paper_id = ?
  `).all(paper.id);
  
  const searchText = `${paper.title} ${paper.abstract}`.toLowerCase();
  
  currentTags.forEach(tag => {
    totalTags++;
    
    // 检查标签是否在标题或摘要中明确出现
    const tagNameLower = tag.name.toLowerCase();
    const isMentioned = searchText.includes(tagNameLower);
    
    if (!isMentioned) {
      // 删除这个标签关联
      db.db.prepare('DELETE FROM paper_tags WHERE paper_id = ? AND tag_id = ?').run(paper.id, tag.id);
      removedTags++;
      console.log(`   ❌ 移除："${paper.title.substring(0, 50)}..." 的标签 "${tag.name}" (未明确提及)`);
    }
  });
});

console.log(`\n📊 统计:`);
console.log(`   原有标签关联：${totalTags} 个`);
console.log(`   移除标签关联：${removedTags} 个`);
console.log(`   保留标签关联：${totalTags - removedTags} 个`);
console.log('\n✅ 严格过滤完成\n');
