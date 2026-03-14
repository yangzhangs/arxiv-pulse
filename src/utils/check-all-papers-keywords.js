/**
 * 检查当前论文的关键词匹配
 */

const db = require('../models/database');

// 当前关键词列表
const KEYWORDS = [
  'Docker', 'CI/CD', 'DevOps', 'Microservices', 'Cloud Native',
  'Serverless', 'Hugging Face', 'Github Actions', 
  'Agent skills', 'Deprecated Packages', 'Kubernetes', 'MLOps',
  'Container', 'Automation', 'CI', 'CD',
  'LLM', 'Agent', 'Agents', 'MCP', 'Code Agents'
];

console.log('🔍 检查所有论文的关键词匹配...\n');

const allPapers = db.db.prepare(`
  SELECT id, arxiv_id, title
  FROM papers
  ORDER BY published_date DESC
`).all();

console.log(`📄 总论文数：${allPapers.length}\n`);

allPapers.forEach((paper, idx) => {
  const foundKeywords = [];
  
  KEYWORDS.forEach(keyword => {
    if (paper.title.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  });
  
  if (foundKeywords.length === 0) {
    console.log(`❌ 未匹配：${paper.title}`);
    console.log(`   Arxiv ID: ${paper.arxiv_id}\n`);
  } else {
    console.log(`✅ ${idx + 1}. ${paper.title.substring(0, 60)}...`);
    console.log(`   匹配关键词：${foundKeywords.join(', ')}\n`);
  }
});
