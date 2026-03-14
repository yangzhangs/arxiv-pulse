/**
 * 自动标签脚本
 * 根据论文标题和摘要自动匹配标签
 */

const db = require('../models/database');

// 标签关键词映射
const TAG_KEYWORDS = {
  'Docker': ['docker', '容器', 'container', 'containerization'],
  'CI/CD': ['ci/cd', 'continuous integration', 'continuous deployment', 'continuous delivery', 'jenkins', 'gitlab ci'],
  'DevOps': ['devops', '开发运维', 'sre', 'site reliability'],
  '微服务': ['microservice', '微服务', 'micro-service', 'service-oriented'],
  '云原生': ['cloud native', '云原生', 'kubernetes', 'k8s'],
  'Serverless': ['serverless', '无服务器', 'faas', 'function-as-a-service', 'aws lambda', 'azure functions'],
  'Hugging Face': ['hugging face', 'transformers', 'diffusers', 'gradio'],
  'Github Actions': ['github actions', 'github workflow', 'actions'],
  'Agent skills': ['agent', 'agents', 'llm agent', 'language agent', 'autonomous agent', 'multi-agent', 'skill'],
  '弃用包': ['deprecated', '弃用', 'obsolete', 'legacy', 'end-of-life'],
  'MLOps': ['mlops', 'ml ops', 'machine learning ops', 'model deployment'],
  'LLM': ['llm', 'large language model', '大语言模型', 'foundation model'],
  'MCP': ['mcp', 'model context protocol', 'context protocol']
};

/**
 * 为论文自动匹配标签
 * @param {string} title - 论文标题
 * @param {string} abstract - 论文摘要
 * @returns {string[]} - 匹配的标签列表
 */
function matchTags(title, abstract) {
  const searchText = `${title} ${abstract}`.toLowerCase();
  const matchedTags = [];

  for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
    for (const keyword of keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        if (!matchedTags.includes(tag)) {
          matchedTags.push(tag);
        }
        break;
      }
    }
  }

  return matchedTags;
}

/**
 * 为所有没有标签的论文自动添加标签
 */
function autoTagPapers() {
  console.log('🏷️  开始自动标签...\n');

  // 获取所有没有标签的论文
  const papersWithoutTags = db.db.prepare(`
    SELECT p.id, p.title, p.abstract
    FROM papers p
    LEFT JOIN paper_tags pt ON p.id = pt.paper_id
    WHERE pt.paper_id IS NULL
  `).all();

  console.log(`📄 找到 ${papersWithoutTags.length} 篇没有标签的论文\n`);

  let tagged = 0;
  let skipped = 0;

  papersWithoutTags.forEach(paper => {
    try {
      const matchedTags = matchTags(paper.title, paper.abstract || '');
      
      if (matchedTags.length > 0) {
        // 添加匹配的标签
        matchedTags.forEach(tagName => {
          try {
            db.addPaperTag(paper.id, tagName);
          } catch (tagError) {
            // 标签可能不存在，跳过
          }
        });
        
        tagged++;
        console.log(`✅ ${paper.title.substring(0, 60)}...`);
        console.log(`   标签：${matchedTags.join(', ')}`);
      } else {
        skipped++;
        console.log(`⭕ ${paper.title.substring(0, 60)}... (无匹配标签)`);
      }
    } catch (error) {
      console.error(`❌ 处理失败：${paper.id} - ${error.message}`);
      skipped++;
    }
  });

  console.log(`\n📊 统计:`);
  console.log(`   ✅ 已标签：${tagged} 篇`);
  console.log(`   ⭕ 无匹配：${skipped} 篇`);
  console.log(`\n✅ 自动标签完成\n`);
}

// 运行
autoTagPapers();
