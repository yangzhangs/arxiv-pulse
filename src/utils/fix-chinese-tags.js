/**
 * 修复标签 - 将中文标签改为英文
 */

const db = require('../models/database');

console.log('🏷️  开始修复中文标签...\n');

// 中文到英文的映射
const tagMap = {
  '微服务': 'Microservices',
  '云原生': 'Cloud Native',
  '弃用包': 'Deprecated Packages'
};

let updated = 0;

for (const [zh, en] of Object.entries(tagMap)) {
  try {
    // 检查中文标签是否存在
    const zhTag = db.db.prepare('SELECT id, name FROM tags WHERE name = ?').get(zh);
    
    if (zhTag) {
      // 更新标签名称
      db.db.prepare('UPDATE tags SET name = ? WHERE id = ?').run(en, zhTag.id);
      console.log(`✅ ${zh} → ${en}`);
      updated++;
    } else {
      console.log(`⭕ ${zh} (不存在)`);
    }
  } catch (error) {
    console.error(`❌ 更新失败：${zh} - ${error.message}`);
  }
}

console.log(`\n✅ 已更新 ${updated} 个标签\n`);

// 显示所有标签
console.log('📊 当前标签列表:');
const tags = db.db.prepare('SELECT id, name FROM tags WHERE is_approved = 1 ORDER BY id').all();
tags.forEach(tag => {
  console.log(`   - ${tag.name}`);
});
console.log('');
