/**
 * 检查论文的标签关联
 */

const db = require('../models/database');

console.log('🔍 检查论文标签关联...\n');

const papers = db.db.prepare(`
  SELECT p.id, p.arxiv_id, p.title, GROUP_CONCAT(t.name) as tags
  FROM papers p
  LEFT JOIN paper_tags pt ON p.id = pt.paper_id
  LEFT JOIN tags t ON pt.tag_id = t.id
  GROUP BY p.id
`).all();

papers.forEach(paper => {
  console.log(`📄 ${paper.title}`);
  console.log(`   Arxiv ID: ${paper.arxiv_id}`);
  console.log(`   数据库标签：${paper.tags || '无'}`);
  
  // 检查标题中的关键词
  const keywords = ['Docker', 'CI/CD', 'DevOps', 'Microservices', 'Cloud Native',
    'Serverless', 'Hugging Face', 'Github Actions', 
    'Agent skills', 'Deprecated Packages'];
  
  const matched = keywords.filter(k => paper.title.includes(k));
  console.log(`   标题匹配：${matched.length > 0 ? matched.join(', ') : '无'}`);
  console.log('');
});
