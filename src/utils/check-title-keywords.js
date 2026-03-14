/**
 * 检查论文标题关键词匹配
 */

const db = require('../models/database');

// 强相关关键词列表
const KEYWORDS = [
  'Docker', 'CI/CD', 'DevOps', 'Microservices', 'Cloud Native',
  'Serverless', 'Hugging Face', 'Github Actions', 
  'Agent skills', 'Deprecated Packages', 'Kubernetes', 'MLOps',
  'Container', 'Automation', 'CI', 'CD',
  'LLM', 'Agent', 'Agents', 'MCP', 'Code Agents'
];

console.log('🔍 检查论文标题关键词匹配...\n');

const allPapers = db.db.prepare(`
  SELECT id, arxiv_id, title, abstract
  FROM papers
  ORDER BY published_date DESC
`).all();

console.log(`📄 总论文数：${allPapers.length}\n`);

let matched = 0;
let notMatched = [];

allPapers.forEach(paper => {
  const title = paper.title;
  const foundKeywords = [];
  
  KEYWORDS.forEach(keyword => {
    if (title.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  });
  
  if (foundKeywords.length > 0) {
    matched++;
  } else {
    notMatched.push({ paper, foundKeywords });
  }
});

console.log(`✅ 标题匹配关键词：${matched} 篇`);
console.log(`❌ 标题未匹配关键词：${notMatched.length} 篇\n`);

if (notMatched.length > 0) {
  console.log('📄 标题未匹配关键词的论文:\n');
  notMatched.forEach((item, idx) => {
    const paper = item.paper;
    console.log(`${idx + 1}. ${paper.title}`);
    console.log(`   Arxiv ID: ${paper.arxiv_id}`);
    console.log('');
  });
}

console.log('\n💡 提示：标题必须明确包含关键词才符合强相关标准\n');
