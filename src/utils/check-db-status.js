/**
 * 数据库检查和修复脚本
 */

const db = require('../models/database');

console.log('🔍 检查数据库状态...\n');

// 1. 检查论文总数
const totalPapers = db.db.prepare('SELECT COUNT(*) as count FROM papers').get();
console.log(`📄 论文总数：${totalPapers.count}`);

// 2. 检查标签总数
const totalTags = db.db.prepare('SELECT COUNT(*) as count FROM tags WHERE is_approved = 1').get();
console.log(`🏷️  标签总数：${totalTags.count}`);

// 3. 检查管理员账户
const admins = db.db.prepare('SELECT id, username, email FROM admins').all();
console.log(`👤 管理员账户:`);
if (admins.length === 0) {
  console.log('   ⚠️  没有管理员账户！');
} else {
  admins.forEach(admin => {
    console.log(`   - ID: ${admin.id}, 用户名：${admin.username}, 邮箱：${admin.email || '未设置'}`);
  });
}

// 4. 检查论文标签关联
const paperTagsCount = db.db.prepare('SELECT COUNT(*) as count FROM paper_tags').get();
console.log(`📊 论文 - 标签关联数：${paperTagsCount.count}`);

// 5. 检查有标签的论文数量
const papersWithTags = db.db.prepare(`
  SELECT COUNT(DISTINCT paper_id) as count FROM paper_tags
`).get();
console.log(`📄 有标签的论文数：${papersWithTags.count}`);

// 6. 检查所有标签及其论文数量
console.log('\n️  标签详情:');
const tags = db.db.prepare(`
  SELECT t.id, t.name, COUNT(pt.paper_id) as paper_count
  FROM tags t
  LEFT JOIN paper_tags pt ON t.id = pt.tag_id
  WHERE t.is_approved = 1
  GROUP BY t.id, t.name
  ORDER BY t.name
`).all();

tags.forEach(tag => {
  console.log(`   - ${tag.name}: ${tag.paper_count} 篇论文`);
});

// 7. 检查前 5 篇论文的标签
console.log('\n📄 前 5 篇论文的标签:');
const samplePapers = db.db.prepare(`
  SELECT p.id, p.title, GROUP_CONCAT(t.name) as tags
  FROM papers p
  LEFT JOIN paper_tags pt ON p.id = pt.paper_id
  LEFT JOIN tags t ON pt.tag_id = t.id
  GROUP BY p.id
  ORDER BY p.published_date DESC
  LIMIT 5
`).all();

samplePapers.forEach((paper, idx) => {
  console.log(`   ${idx + 1}. ${paper.title.substring(0, 50)}...`);
  console.log(`      标签：${paper.tags || '无'}`);
});

console.log('\n✅ 检查完成\n');
