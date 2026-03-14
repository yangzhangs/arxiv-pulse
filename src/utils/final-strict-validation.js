/**
 * 最终验证 - 严格关键词匹配
 */

const db = require('../models/database');

console.log('════════════════════════════════════════════════════════');
console.log('        ArxivPulse - 严格关键词匹配验证报告');
console.log('════════════════════════════════════════════════════════\n');

// 1. 总论文数
const totalPapers = db.db.prepare('SELECT COUNT(*) as count FROM papers').get();
console.log(`📄 总论文数：${totalPapers.count}\n`);

// 2. 关键词匹配检查
const KEYWORDS = [
  'Docker', 'CI/CD', 'DevOps', 'Microservices', 'Cloud Native',
  'Serverless', 'Hugging Face', 'Github Actions', 
  'Deprecated Packages', 'Kubernetes', 'MLOps',
  'Container', 'Automation', 'LLM', 'MCP', 'Code Agents'
];

function hasAgentKeyword(title) {
  const patterns = [/\bAgent\b/i, /\bAgents\b/i, /\bAgent's\b/i];
  for (const pattern of patterns) {
    if (pattern.test(title)) return true;
  }
  return false;
}

const allPapers = db.db.prepare(`
  SELECT id, arxiv_id, title
  FROM papers
  ORDER BY published_date DESC
`).all();

let allMatched = true;
console.log('📋 论文关键词匹配详情:\n');

allPapers.forEach((paper, idx) => {
  let matched = false;
  const foundKeywords = [];
  
  KEYWORDS.forEach(keyword => {
    if (paper.title.includes(keyword)) {
      foundKeywords.push(keyword);
      matched = true;
    }
  });
  
  if (hasAgentKeyword(paper.title)) {
    matched = true;
    if (paper.title.match(/\bAgents\b/i)) foundKeywords.push('Agents');
    if (paper.title.match(/\bAgent\b/i)) foundKeywords.push('Agent');
  }
  
  if (!matched) {
    console.log(`❌ ${idx + 1}. ${paper.title}`);
    allMatched = false;
  } else {
    console.log(`✅ ${idx + 1}. ${paper.title.substring(0, 50)}... [${foundKeywords.join(', ')}]`);
  }
});

console.log('\n════════════════════════════════════════════════════════');
if (allMatched) {
  console.log('          ✅ 所有论文都严格匹配关键词！');
} else {
  console.log('          ❌ 仍有论文未匹配关键词');
}
console.log('════════════════════════════════════════════════════════\n');
