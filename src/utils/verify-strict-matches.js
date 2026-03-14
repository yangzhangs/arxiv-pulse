/**
 * 严格验证所有关键词连续匹配
 */

const db = require('../models/database');

// 关键词列表（按优先级排序）
const KEYWORDS = [
  'Agent skills',      // 多词连续
  'Cloud Native',      // 多词连续
  'Hugging Face',      // 多词连续
  'Github Actions',    // 多词连续
  'Deprecated Packages', // 多词连续
  'Code Agents',       // 多词连续
  'Microservices',
  'Docker',
  'CI/CD',
  'DevOps',
  'Serverless',
  'Kubernetes',
  'MLOps',
  'Container',
  'Automation',
  'LLM',
  'MCP',
  'Agent',             // 单独匹配（完整单词）
  'Agents'             // 单独匹配（完整单词）
];

// 检查完整单词匹配（用于 Agent/Agents）
function hasWholeWord(title, word) {
  const pattern = new RegExp(`\\b${word}\\b`, 'i');
  return pattern.test(title);
}

// 检查连续短语匹配
function hasPhrase(title, phrase) {
  return title.includes(phrase);
}

console.log('🔍 严格验证关键词连续匹配...\n');

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
    if (keyword === 'Agent' || keyword === 'Agents') {
      if (hasWholeWord(paper.title, keyword)) {
        foundKeywords.push(keyword);
      }
    } else {
      if (hasPhrase(paper.title, keyword)) {
        foundKeywords.push(keyword);
      }
    }
  });
  
  if (foundKeywords.length > 0) {
    matched++;
    console.log(`✅ ${paper.title.substring(0, 50)}...`);
    console.log(`   匹配：${foundKeywords.join(', ')}\n`);
  } else {
    notMatched.push(paper);
    console.log(`❌ ${paper.title.substring(0, 50)}...`);
    console.log(`   未匹配任何关键词\n`);
  }
});

console.log(`\n📊 统计:`);
console.log(`   ✅ 匹配：${matched} 篇`);
console.log(`   ❌ 未匹配：${notMatched.length} 篇`);

if (notMatched.length > 0) {
  console.log(`\n💡 提示：${notMatched.length} 篇论文未匹配任何关键词，应删除\n`);
}
