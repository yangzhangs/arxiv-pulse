/**
 * 验证会议/期刊标记功能
 */

const db = require('../models/database');

console.log('════════════════════════════════════════════════════════');
console.log('           论文会议/期刊标记验证');
console.log('════════════════════════════════════════════════════════\n');

const papers = db.db.prepare(`
  SELECT id, arxiv_id, title, comments
  FROM papers
`).all();

papers.forEach(paper => {
  console.log(`📄 ${paper.title}`);
  console.log(`   Arxiv ID: ${paper.arxiv_id}`);
  
  if (paper.comments) {
    console.log(`   📝 Comments:`);
    console.log(`      ${paper.comments}\n`);
    
    // 解析 accepted at
    const match = paper.comments.match(/accepted at (.+?)(?:\.|$)/i);
    if (match) {
      const fullName = match[1].trim();
      const abbr = fullName.match(/\(([^)]+)\)/);
      console.log(`   ✅ 已接受:`);
      console.log(`      全称：${fullName}`);
      console.log(`      缩写：${abbr ? abbr[1] : '无'}`);
      console.log(`      显示标记：${abbr ? abbr[1] : fullName}\n`);
    }
  } else {
    console.log(`   ⭕ 无 comments 信息\n`);
  }
});

console.log('════════════════════════════════════════════════════════');
console.log('                    ✅ 验证完成');
console.log('════════════════════════════════════════════════════════\n');
