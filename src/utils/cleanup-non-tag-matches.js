/**
 * 删除只匹配 Agent 或不在标签列表的关键词的论文
 */

const db = require('../models/database');

// 当前标签列表（10 个英文标签）
const TAG_KEYWORDS = [
  'Docker', 'CI/CD', 'DevOps', 'Microservices', 'Cloud Native',
  'Serverless', 'Hugging Face', 'Github Actions', 
  'Agent skills', 'Deprecated Packages'
];

// Code Agents 也应该保留（复合关键词）
const KEEP_KEYWORDS = [...TAG_KEYWORDS, 'Code Agents'];

// 检查完整单词匹配
function hasWholeWord(title, word) {
  const pattern = new RegExp(`\\b${word}\\b`, 'i');
  return pattern.test(title);
}

// 检查连续短语匹配
function hasPhrase(title, phrase) {
  return title.includes(phrase);
}

console.log('🗑️  删除不符合标签列表的论文...\n');

const allPapers = db.db.prepare(`
  SELECT id, arxiv_id, title
  FROM papers
`).all();

let deleted = 0;
let kept = 0;

allPapers.forEach(paper => {
  const foundKeywords = [];
  
  // 检查标签列表中的关键词
  KEEP_KEYWORDS.forEach(keyword => {
    if (hasPhrase(paper.title, keyword)) {
      foundKeywords.push(keyword);
    }
  });
  
  if (foundKeywords.length > 0) {
    kept++;
  } else {
    try {
      db.db.prepare('DELETE FROM paper_tags WHERE paper_id = ?').run(paper.id);
      db.db.prepare('DELETE FROM papers WHERE id = ?').run(paper.id);
      
      deleted++;
      console.log(`❌ 删除：${paper.title}`);
      console.log(`   Arxiv ID: ${paper.arxiv_id}\n`);
    } catch (error) {
      console.error(`❌ 删除失败：${paper.id} - ${error.message}`);
    }
  }
});

console.log(`\n📊 统计:`);
console.log(`   🗑️  已删除：${deleted} 篇`);
console.log(`   ✅ 保留：${kept} 篇`);
console.log(`\n✅ 清理完成\n`);
