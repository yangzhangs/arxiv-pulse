/**
 * 清理只包含 "Agentic" 而不包含完整 "Agent"/"Agents" 的论文
 */

const db = require('../models/database');

// 检查是否包含完整的 Agent/Agents 单词
function hasAgentKeyword(title) {
  const patterns = [
    /\bAgent\b/i,
    /\bAgents\b/i,
    /\bAgent's\b/i,
  ];
  for (const pattern of patterns) {
    if (pattern.test(title)) {
      return true;
    }
  }
  return false;
}

// 其他关键词
const OTHER_KEYWORDS = [
  'Docker', 'CI/CD', 'DevOps', 'Microservices', 'Cloud Native',
  'Serverless', 'Hugging Face', 'Github Actions', 
  'Deprecated Packages', 'Kubernetes', 'MLOps',
  'Container', 'Automation', 'LLM', 'MCP', 'Code Agents'
];

function hasOtherKeyword(title) {
  for (const keyword of OTHER_KEYWORDS) {
    if (title.includes(keyword)) {
      return true;
    }
  }
  return false;
}

console.log('🗑️  清理只包含 "Agentic" 的论文...\n');

const allPapers = db.db.prepare(`
  SELECT id, arxiv_id, title
  FROM papers
`).all();

let deleted = 0;
let kept = 0;

allPapers.forEach(paper => {
  const hasAgent = hasAgentKeyword(paper.title);
  const hasOther = hasOtherKeyword(paper.title);
  
  if (!hasAgent && !hasOther) {
    try {
      db.db.prepare('DELETE FROM paper_tags WHERE paper_id = ?').run(paper.id);
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
