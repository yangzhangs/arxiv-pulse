/**
 * 直接检查数据库标签
 */

const db = require('../models/database');

console.log('🏷️  数据库标签检查:\n');

const allTags = db.db.prepare('SELECT * FROM tags ORDER BY id').all();
console.log(`所有标签 (${allTags.length} 个):\n`);

allTags.forEach(tag => {
  console.log(`ID: ${tag.id}, 名称：${tag.name}, 审核：${tag.is_approved ? '是' : '否'}`);
});

console.log('\n\n已审核标签:\n');
const approvedTags = db.db.prepare('SELECT * FROM tags WHERE is_approved = 1 ORDER BY id').all();
approvedTags.forEach(tag => {
  console.log(`ID: ${tag.id}, 名称：${tag.name}`);
});
console.log('');
