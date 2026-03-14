/**
 * 检查 "Agent" 匹配情况 - 区分 Agent 和 Agentic
 */

const db = require('../models/database');

console.log('🔍 检查 "Agent" 关键词匹配详情...\n');

const allPapers = db.db.prepare(`
  SELECT id, arxiv_id, title
  FROM papers
  ORDER BY published_date DESC
`).all();

allPapers.forEach(paper => {
  const hasAgent = paper.title.includes('Agent');
  const hasAgentic = paper.title.includes('Agentic');
  const hasAgents = paper.title.includes('Agents');
  
  if (hasAgent || hasAgentic || hasAgents) {
    console.log(`📄 ${paper.title}`);
    console.log(`   - 包含 "Agent": ${hasAgent ? '✅' : '❌'}`);
    console.log(`   - 包含 "Agentic": ${hasAgentic ? '✅' : '❌'}`);
    console.log(`   - 包含 "Agents": ${hasAgents ? '✅' : '❌'}`);
    console.log('');
  }
});
