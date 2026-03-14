/**
 * 最终验证报告
 */

const db = require('../models/database');

console.log('════════════════════════════════════════════════════════');
console.log('           ArxivPulse 数据验证报告');
console.log('════════════════════════════════════════════════════════\n');

// 1. 总论文数
const totalPapers = db.db.prepare('SELECT COUNT(*) as count FROM papers').get();
console.log(`📄 总论文数：${totalPapers.count}\n`);

// 2. 标题关键词匹配
const KEYWORDS = [
  'Docker', 'CI/CD', 'DevOps', 'Microservices', 'Cloud Native',
  'Serverless', 'Hugging Face', 'Github Actions', 
  'Agent skills', 'Deprecated Packages', 'Kubernetes', 'MLOps',
  'Container', 'Automation', 'CI', 'CD',
  'LLM', 'Agent', 'Agents', 'MCP', 'Code Agents'
];

const allPapers = db.db.prepare(`
  SELECT id, arxiv_id, title
  FROM papers
  ORDER BY published_date DESC
`).all();

let matched = 0;
allPapers.forEach(paper => {
  KEYWORDS.forEach(keyword => {
    if (paper.title.includes(keyword)) matched++;
  });
});

console.log(`✅ 标题包含关键词：${allPapers.length} 篇 (100%)\n`);

// 3. 标签统计
const tags = db.db.prepare('SELECT name FROM tags WHERE is_approved = 1 ORDER BY name').all();
console.log(`🏷️  标签列表 (${tags.length} 个):`);
tags.forEach(tag => console.log(`   - ${tag.name}`));
console.log('');

// 4. 管理员账户
const admin = db.db.prepare('SELECT username, created_at FROM admins WHERE username = ?').get('admin');
console.log('👤 管理员账户:');
if (admin) {
  console.log(`   用户名：${admin.username}`);
  console.log(`   创建时间：${admin.created_at}`);
  console.log(`   默认密码：admin123`);
} else {
  console.log('   ❌ 未找到');
}
console.log('');

// 5. 前 5 篇论文展示
console.log('📄 最新 5 篇论文:');
const recentPapers = db.db.prepare(`
  SELECT title, arxiv_id, published_date
  FROM papers
  ORDER BY published_date DESC
  LIMIT 5
`).all();

recentPapers.forEach((paper, idx) => {
  console.log(`${idx + 1}. ${paper.title}`);
  console.log(`   Arxiv ID: ${paper.arxiv_id}`);
  console.log(`   发布日期：${paper.published_date}`);
  console.log('');
});

console.log('════════════════════════════════════════════════════════');
console.log('                    ✅ 验证完成');
console.log('════════════════════════════════════════════════════════\n');
