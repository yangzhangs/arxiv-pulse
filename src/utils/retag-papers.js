/**
 * 重新为论文打标签 - 基于中文关键词匹配
 */

const db = require('../models/database');

console.log('🏷️ 开始重新标注论文...\n');

// 关键词映射（英文关键词 -> 中文标签）
const keywordMap = {
  'docker': 'Docker',
  'ci/cd': 'CI/CD',
  'continuous integration': 'CI/CD',
  'continuous deployment': 'CI/CD',
  'devops': 'DevOps',
  'microservice': '微服务',
  'micro-services': '微服务',
  'cloud native': '云原生',
  'serverless': 'Serverless',
  'hugging face': 'Hugging Face',
  'github action': 'Github Actions',
  'agent': 'Agent skills',
  'language agent': 'Agent skills',
  'llm agent': 'Agent skills',
  'deprecated': '弃用包',
  'obsolete package': '弃用包'
};

// 获取所有论文
const papers = db.db.prepare('SELECT id, title, abstract FROM papers').all();

let totalPapers = papers.length;
let taggedPapers = 0;
let totalTags = 0;

papers.forEach(paper => {
  const searchText = `${paper.title} ${paper.abstract}`.toLowerCase();
  
  // 清除旧标签
  db.db.prepare('DELETE FROM paper_tags WHERE paper_id = ?').run(paper.id);
  
  // 查找匹配的关键词
  const matchedTags = new Set();
  
  for (const [keyword, tagName] of Object.entries(keywordMap)) {
    if (searchText.includes(keyword)) {
      matchedTags.add(tagName);
    }
  }
  
  // 添加新标签
  if (matchedTags.size > 0) {
    taggedPapers++;
    console.log(`\n📄 ${paper.title.substring(0, 60)}...`);
    
    matchedTags.forEach(tagName => {
      try {
        db.addPaperTag(paper.id, tagName);
        totalTags++;
        console.log(`   ✅ 添加标签：${tagName}`);
      } catch (error) {
        console.warn(`   ⚠️  标签 "${tagName}" 添加失败：${error.message}`);
      }
    });
  }
});

console.log(`\n📊 统计:`);
console.log(`   论文总数：${totalPapers} 篇`);
console.log(`   已打标签：${taggedPapers} 篇`);
console.log(`   标签总数：${totalTags} 个`);
console.log('\n✅ 重新标注完成\n');
