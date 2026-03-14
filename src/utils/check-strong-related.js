/**
 * 检查并清理不符合强相关标准的论文
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
 * @param {string} title - 论文标题
 * @param {string} abstract - 论文摘要
 * @returns {boolean} - 是否强相关
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

console.log('🔍 检查数据库论文数据...\n');

// 获取所有论文
const allPapers = db.db.prepare(`
  SELECT id, arxiv_id, title, abstract, published_date
  FROM papers
  ORDER BY published_date DESC
`).all();

console.log(`📄 总论文数：${allPapers.length}\n`);

let related = 0;
let notRelated = [];

allPapers.forEach(paper => {
  const isRelated = isStrongRelated(paper.title, paper.abstract || '');
  
  if (isRelated) {
    related++;
  } else {
    notRelated.push(paper);
  }
});

console.log(`✅ 强相关：${related} 篇`);
console.log(`❌ 非强相关：${notRelated.length} 篇\n`);

if (notRelated.length > 0) {
  console.log('📄 非强相关论文列表:\n');
  notRelated.forEach((paper, idx) => {
    console.log(`${idx + 1}. ${paper.title}`);
    console.log(`   Arxiv ID: ${paper.arxiv_id}`);
    console.log(`   发布日期：${paper.published_date}`);
    console.log('');
  });
  
  console.log('💡 提示：运行 node src/utils/cleanup-non-related.js 删除这些论文\n');
}
