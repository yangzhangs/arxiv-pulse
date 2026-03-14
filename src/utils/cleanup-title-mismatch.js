/**
 * 清理标题未匹配关键词的论文
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

/**
 * 检查标题是否包含关键词
 */
function titleHasKeyword(title) {
  for (const keyword of KEYWORDS) {
    if (title.includes(keyword)) {
      return true;
    }
  }
  return false;
}

console.log('🗑️  开始清理标题未匹配关键词的论文...\n');

const allPapers = db.db.prepare(`
  SELECT id, arxiv_id, title
  FROM papers
`).all();

let deleted = 0;
let kept = 0;

allPapers.forEach(paper => {
  if (!titleHasKeyword(paper.title)) {
    try {
      // 先删除关联的标签
      db.db.prepare('DELETE FROM paper_tags WHERE paper_id = ?').run(paper.id);
      // 删除论文
      db.db.prepare('DELETE FROM papers WHERE id = ?').run(paper.id);
      
      deleted++;
      console.log(`❌ 删除：${paper.title}`);
      console.log(`   Arxiv ID: ${paper.arxiv_id}\n`);
    } catch (error) {
      console.error(`❌ 删除失败：${paper.id} - ${error.message}`);
    }
  } else {
    kept++;
  }
});

console.log(`\n📊 统计:`);
console.log(`   🗑️  已删除：${deleted} 篇`);
console.log(`   ✅ 保留：${kept} 篇`);
console.log(`\n✅ 清理完成\n`);
