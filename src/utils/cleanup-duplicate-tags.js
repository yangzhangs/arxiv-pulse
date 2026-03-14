/**
 * 清理重复的中文标签
 */

const db = require('../models/database');

console.log('🗑️  清理重复中文标签...\n');

// 中文标签名称
const chineseTags = ['微服务', '云原生', '弃用包'];

chineseTags.forEach(zhTag => {
  try {
    // 检查是否存在
    const tag = db.db.prepare('SELECT id, name FROM tags WHERE name = ?').get(zhTag);
    
    if (tag) {
      // 删除中文标签
      db.db.prepare('DELETE FROM tags WHERE id = ?').run(tag.id);
      console.log(`✅ 删除中文标签：${zhTag} (ID: ${tag.id})`);
    } else {
      console.log(`⭕ ${zhTag} (不存在)`);
    }
  } catch (error) {
    console.error(`❌ 删除失败：${zhTag} - ${error.message}`);
  }
});

console.log('\n📊 当前标签列表:');
const tags = db.db.prepare('SELECT id, name FROM tags WHERE is_approved = 1 ORDER BY id').all();
tags.forEach(tag => {
  console.log(`   - ${tag.name}`);
});
console.log('');
