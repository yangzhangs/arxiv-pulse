/**
 * 解析 comments 中的会议/期刊信息
 */

const db = require('../models/database');

// 解析 accepted at 信息
function parseAcceptedInfo(comments) {
  if (!comments) return null;
  
  // 匹配 "accepted at" 模式
  const acceptedMatch = comments.match(/accepted at (.+?)(?:\.|$)/i);
  
  if (acceptedMatch) {
    const fullName = acceptedMatch[1].trim();
    
    // 提取会议/期刊缩写（括号中的内容）
    const abbrMatch = fullName.match(/\(([^)]+)\)/);
    const abbreviation = abbrMatch ? abbrMatch[1] : null;
    
    return {
      fullName,
      abbreviation,
      type: fullName.includes('Conference') ? 'conference' : 
            fullName.includes('Journal') ? 'journal' : 'other'
    };
  }
  
  return null;
}

console.log('🔍 解析论文 comments 中的会议/期刊信息...\n');

const papers = db.db.prepare(`
  SELECT id, arxiv_id, title, comments
  FROM papers
`).all();

papers.forEach(paper => {
  const info = parseAcceptedInfo(paper.comments);
  
  console.log(`📄 ${paper.title.substring(0, 50)}...`);
  console.log(`   Arxiv ID: ${paper.arxiv_id}`);
  
  if (info) {
    console.log(`   ✅ 已接受:`);
    console.log(`      全称：${info.fullName}`);
    console.log(`      缩写：${info.abbreviation || '无'}`);
    console.log(`      类型：${info.type}`);
  } else {
    console.log(`   ⭕ 无会议/期刊信息`);
  }
  console.log('');
});

module.exports = { parseAcceptedInfo };
