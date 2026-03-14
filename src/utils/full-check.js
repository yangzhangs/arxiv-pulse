/**
 * 全面检查数据库论文和标签
 */

const db = require('../models/database');

console.log('════════════════════════════════════════════════════════');
console.log('           数据库全面检查报告');
console.log('════════════════════════════════════════════════════════\n');

// 1. 检查标签
console.log('🏷️  标签检查:\n');
const allTags = db.db.prepare('SELECT * FROM tags ORDER BY id').all();
console.log(`所有标签 (${allTags.length} 个):\n`);
allTags.forEach(tag => {
  console.log(`ID: ${tag.id}, 名称：${tag.name}, 审核：${tag.is_approved ? '是' : '否'}`);
});

// 检查是否有中文标签
const chineseTags = allTags.filter(t => /[^\x00-\x7F]/.test(t.name));
if (chineseTags.length > 0) {
  console.log(`\n⚠️  发现 ${chineseTags.length} 个中文标签，需要删除:\n`);
  chineseTags.forEach(t => console.log(`   - ${t.name} (ID: ${t.id})`));
} else {
  console.log('\n✅ 所有标签均为英文\n');
}

// 2. 检查论文
console.log('════════════════════════════════════════════════════════\n');
console.log('📄 论文检查:\n');

// 严格连续关键词列表
const KEYWORDS = [
  'Agent skills',
  'Cloud Native',
  'Hugging Face',
  'Github Actions',
  'Deprecated Packages',
  'Code Agents',
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
  'MCP'
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

const allPapers = db.db.prepare(`
  SELECT id, arxiv_id, title, abstract
  FROM papers
  ORDER BY published_date DESC
`).all();

console.log(`总论文数：${allPapers.length}\n`);

let matched = 0;
let notMatched = [];

allPapers.forEach(paper => {
  const foundKeywords = [];
  
  KEYWORDS.forEach(keyword => {
    if (hasPhrase(paper.title, keyword)) {
      foundKeywords.push(keyword);
    }
  });
  
  // 检查 Agent/Agents（完整单词）
  if (hasWholeWord(paper.title, 'Agent')) foundKeywords.push('Agent');
  if (hasWholeWord(paper.title, 'Agents')) foundKeywords.push('Agents');
  
  if (foundKeywords.length > 0) {
    matched++;
  } else {
    notMatched.push(paper);
  }
});

console.log(`✅ 符合严格匹配：${matched} 篇`);
console.log(`❌ 不符合匹配：${notMatched.length} 篇\n`);

if (notMatched.length > 0) {
  console.log('📄 不符合严格匹配的论文:\n');
  notMatched.forEach((paper, idx) => {
    console.log(`${idx + 1}. ${paper.title}`);
    console.log(`   Arxiv ID: ${paper.arxiv_id}`);
    console.log('');
  });
}

console.log('════════════════════════════════════════════════════════\n');
