/**
 * 检查当前论文的关键词匹配
 */

const db = require('../models/database');

// 标签列表（10 个）
const TAG_KEYWORDS = [
  'Docker', 'CI/CD', 'DevOps', 'Microservices', 'Cloud Native',
  'Serverless', 'Hugging Face', 'Github Actions', 
  'Agent skills', 'Deprecated Packages'
];

console.log('🔍 检查当前论文关键词匹配...\n');

const papers = db.db.prepare(`
  SELECT id, arxiv_id, title
  FROM papers
`).all();

papers.forEach(paper => {
  const foundKeywords = [];
  
  TAG_KEYWORDS.forEach(keyword => {
    if (paper.title.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  });
  
  console.log(`📄 ${paper.title}`);
  console.log(`   Arxiv ID: ${paper.arxiv_id}`);
  console.log(`   匹配标签：${foundKeywords.length > 0 ? foundKeywords.join(', ') : '❌ 无匹配'}`);
  console.log('');
});
