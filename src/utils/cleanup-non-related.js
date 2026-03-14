/**
 * 清理非强相关论文
 */

const db = require('../models/database');

// 强相关关键词列表
const STRONG_RELATED_KEYWORDS = [
  'Docker', 'CI/CD', 'DevOps', 'Microservices', 'Cloud Native', 
  'Serverless', 'Hugging Face', 'Github Actions', 
  'Agent skills', 'Deprecated Packages', 'Kubernetes', 'MLOps',
  'Container', 'Automation', 'CI', 'CD',
  'LLM', 'Agent', 'Agents', 'MCP', 'Code Agents'
];

/**
 * 检查论文是否与强相关关键词匹配
 */
function isStrongRelated(title, abstract) {
  const searchText = `${title} ${abstract}`;
  for (const keyword of STRONG_RELATED_KEYWORDS) {
    if (searchText.includes(keyword)) {
      return true;
    }
  }
  return false;
}

console.log('🗑️  开始清理非强相关论文...\n');

// 获取所有论文
const allPapers = db.db.prepare(`
  SELECT id, arxiv_id, title, abstract
  FROM papers
`).all();

let deleted = 0;
let kept = 0;

allPapers.forEach(paper => {
  const isRelated = isStrongRelated(paper.title, paper.abstract || '');
  
  if (!isRelated) {
    try {
      // 先删除关联的标签
      db.db.prepare('DELETE FROM paper_tags WHERE paper_id = ?').run(paper.id);
      // 删除论文
      db.db.prepare('DELETE FROM papers WHERE id = ?').run(paper.id);
      
      deleted++;
      console.log(`❌ 删除：${paper.title.substring(0, 60)}...`);
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
