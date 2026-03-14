/**
 * 严格检查标题关键词匹配（完整单词匹配）
 */

const db = require('../models/database');

// 关键词列表
const KEYWORDS = [
  'Docker', 'CI/CD', 'DevOps', 'Microservices', 'Cloud Native',
  'Serverless', 'Hugging Face', 'Github Actions', 
  'Deprecated Packages', 'Kubernetes', 'MLOps',
  'Container', 'Automation', 'LLM', 'MCP', 'Code Agents'
];

// 特殊处理 Agent/Agents
function hasAgentKeyword(title) {
  // 匹配 "Agent" 作为完整单词（不是 Agentic 的一部分）
  const agentPatterns = [
    /\bAgent\b/i,      // 完整单词 Agent
    /\bAgents\b/i,     // 完整单词 Agents
    /\bAgent's\b/i,    // Agent's
  ];
  
  for (const pattern of agentPatterns) {
    if (pattern.test(title)) {
      return true;
    }
  }
  return false;
}

function hasKeyword(title, keyword) {
  if (keyword === 'Agent' || keyword === 'Agents') {
    return hasAgentKeyword(title);
  }
  return title.includes(keyword);
}

console.log('🔍 严格检查标题关键词匹配（完整单词）...\n');

const allPapers = db.db.prepare(`
  SELECT id, arxiv_id, title
  FROM papers
  ORDER BY published_date DESC
`).all();

console.log(`📄 总论文数：${allPapers.length}\n`);

let matched = 0;
let notMatched = [];

allPapers.forEach(paper => {
  const foundKeywords = [];
  
  KEYWORDS.forEach(keyword => {
    if (paper.title.includes(keyword)) {
      foundKeywords.push(keyword);
    }
  });
  
  // 检查 Agent/Agents
  if (hasAgentKeyword(paper.title)) {
    if (paper.title.includes('Agents')) foundKeywords.push('Agents');
    if (paper.title.match(/\bAgent\b/i)) foundKeywords.push('Agent');
  }
  
  if (foundKeywords.length > 0) {
    matched++;
  } else {
    notMatched.push(paper);
  }
});

console.log(`✅ 标题匹配关键词：${matched} 篇`);
console.log(`❌ 标题未匹配关键词：${notMatched.length} 篇\n`);

if (notMatched.length > 0) {
  console.log('📄 未匹配关键词的论文:\n');
  notMatched.forEach((paper, idx) => {
    console.log(`${idx + 1}. ${paper.title}`);
    console.log(`   Arxiv ID: ${paper.arxiv_id}\n`);
  });
}
