/**
 * 彻底清理中文标签
 */

const db = require('../models/database');

console.log('🗑️  彻底清理中文标签...\n');

// 查找所有中文标签
const chineseTags = db.db.prepare(`
  SELECT id, name FROM tags 
  WHERE name LIKE '%微服务%' OR name LIKE '%云原生%' OR name LIKE '%弃用包%'
`).all();

if (chineseTags.length > 0) {
  console.log('发现中文标签:\n');
  chineseTags.forEach(tag => {
    console.log(`   - ${tag.name} (ID: ${tag.id})`);
  });
  
  // 删除中文标签
  const ids = chineseTags.map(t => t.id).join(',');
  db.db.prepare(`DELETE FROM tags WHERE id IN (${ids})`).run();
  
  console.log(`\n✅ 已删除 ${chineseTags.length} 个中文标签\n`);
} else {
  console.log('✅ 未发现中文标签\n');
}

// 显示当前标签
console.log('📊 当前标签列表:');
const tags = db.db.prepare('SELECT id, name FROM tags WHERE is_approved = 1 ORDER BY id').all();
tags.forEach(tag => {
  console.log(`   - ${tag.name}`);
});
console.log('');
