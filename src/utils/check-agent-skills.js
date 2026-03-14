/**
 * 检查 "Agent skills" 连续匹配
 */

const db = require('../models/database');

console.log('🔍 检查 "Agent skills" 连续关键词匹配...\n');

const allPapers = db.db.prepare(`
  SELECT id, arxiv_id, title
  FROM papers
  ORDER BY published_date DESC
`).all();

allPapers.forEach(paper => {
  const hasAgentSkills = paper.title.includes('Agent skills');
  const hasAgent = paper.title.includes('Agent');
  const hasSkills = paper.title.includes('skills');
  
  if (hasAgent || hasAgentSkills) {
    console.log(`📄 ${paper.title}`);
    console.log(`   - "Agent skills" (连续): ${hasAgentSkills ? '✅' : '❌'}`);
    console.log(`   - "Agent": ${hasAgent ? '✅' : '❌'}`);
    console.log(`   - "skills": ${hasSkills ? '✅' : '❌'}`);
    console.log('');
  }
});
