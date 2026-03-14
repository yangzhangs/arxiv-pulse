/**
 * 检查只匹配 Agent 或不在标签列表的关键词的论文
 */

const db = require('../models/database');

// 当前标签列表（10 个英文标签）
const TAG_KEYWORDS = [
  'Docker', 'CI/CD', 'DevOps', 'Microservices', 'Cloud Native',
  'Serverless', 'Hugging Face', 'Github Actions', 
  'Agent skills', 'Deprecated Packages'
];

// 额外允许的关键词（这些也应该在标签列表中）
const EXTRA_KEYWORDS = [
  'Code Agents', 'LLM', 'MCP', 'Container', 'Automation',
  'Kubernetes', 'MLOps', 'Agent', 'Agents'
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

console.log('🔍 检查论文关键词匹配...\n');

const allPapers = db.db.prepare(`
  SELECT id, arxiv_id, title
  FROM papers
  ORDER BY published_date DESC
`).all();

console.log(`📄 总论文数：${allPapers.length}\n`);

let keep = [];
let remove = [];

allPapers.forEach(paper => {
  const foundKeywords = [];
  
  // 检查标签列表中的关键词
  TAG_KEYWORDS.forEach(keyword => {
    if (hasPhrase(paper.title, keyword)) {
      foundKeywords.push(keyword);
    }
  });
  
  // 检查额外关键词
  EXTRA_KEYWORDS.forEach(keyword => {
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
  
  // 过滤：只保留匹配标签列表中的关键词的论文
  const tagMatches = foundKeywords.filter(k => TAG_KEYWORDS.includes(k) || k === 'Code Agents');
  
  if (tagMatches.length > 0) {
    keep.push({ paper, foundKeywords: tagMatches });
  } else {
    remove.push({ paper, foundKeywords });
  }
});

console.log(`✅ 符合标签列表：${keep.length} 篇`);
console.log(`❌ 需要删除：${remove.length} 篇\n`);

if (remove.length > 0) {
  console.log('📄 需要删除的论文:\n');
  remove.forEach((item, idx) => {
    console.log(`${idx + 1}. ${item.paper.title}`);
    console.log(`   Arxiv ID: ${item.paper.arxiv_id}`);
    console.log(`   匹配关键词：${item.foundKeywords.join(', ')}`);
    console.log('');
  });
}

console.log('\n📊 保留的论文关键词分布:');
const keywordCount = {};
keep.forEach(item => {
  item.foundKeywords.forEach(k => {
    keywordCount[k] = (keywordCount[k] || 0) + 1;
  });
});
Object.entries(keywordCount).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => {
  console.log(`   ${k}: ${v} 篇`);
});
console.log('');
