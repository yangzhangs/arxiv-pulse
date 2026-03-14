/**
 * 最终验证报告
 */

const db = require('../models/database');

console.log('════════════════════════════════════════════════════════');
console.log('           ArxivPulse 最终验证报告');
console.log('════════════════════════════════════════════════════════\n');

// 1. 标签列表
console.log('🏷️  标签列表:\n');
const tags = db.db.prepare('SELECT name FROM tags WHERE is_approved = 1 ORDER BY id').all();
tags.forEach(tag => console.log(`   - ${tag.name}`));
console.log('');

// 2. 论文
console.log('📄 论文列表:\n');
const papers = db.db.prepare(`
  SELECT id, arxiv_id, title, published_date
  FROM papers
  ORDER BY published_date DESC
`).all();

console.log(`总论文数：${papers.length}\n`);

papers.forEach((paper, idx) => {
  console.log(`${idx + 1}. ${paper.title}`);
  console.log(`   Arxiv ID: ${paper.arxiv_id}`);
  console.log(`   发布日期：${paper.published_date}`);
  console.log('');
});

// 3. 验证匹配
const TAG_KEYWORDS = [
  'Docker', 'CI/CD', 'DevOps', 'Microservices', 'Cloud Native',
  'Serverless', 'Hugging Face', 'Github Actions', 
  'Agent skills', 'Deprecated Packages'
];

console.log('✅ 关键词匹配验证:\n');
papers.forEach(paper => {
  const matched = TAG_KEYWORDS.filter(k => paper.title.includes(k));
  console.log(`   ${paper.title.substring(0, 50)}...`);
  console.log(`   匹配：${matched.length > 0 ? matched.join(', ') : '❌ 无'}\n`);
});

console.log('════════════════════════════════════════════════════════');
console.log('                    ✅ 验证完成');
console.log('════════════════════════════════════════════════════════\n');
