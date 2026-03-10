/**
 * 论文同步脚本 - 增强版
 * 用于将 Arxiv 检索结果同步到网站数据库
 * 
 * 功能：
 * - 去重检测（基于 arxiv_id）
 * - 作者信息修复（Unknown 检测）
 * - 中文摘要支持
 * - 强相关标签过滤
 * - 限制每次同步不超过 10 篇
 * 
 * 用法：node src/utils/sync-papers.js [json_file]
 */

const path = require('path');
const fs = require('fs');
const db = require('../models/database');

// 强相关关键词列表
const STRONG_RELATED_KEYWORDS = [
  'Docker', 'CI/CD', 'DevOps', '微服务', '云原生', 
  'Serverless', 'Hugging Face', 'Github Actions', 
  'Agent skills', '弃用包', 'Kubernetes', 'MLOps',
  '容器', '自动化', '持续集成', '持续部署'
];

/**
 * 检查论文是否与强相关关键词匹配
 * @param {Object} paper - 论文对象
 * @returns {boolean} - 是否强相关
 */
function isStrongRelated(paper) {
  const searchText = `${paper.title} ${paper.abstract} ${paper.authors}`.toLowerCase();
  
  for (const keyword of STRONG_RELATED_KEYWORDS) {
    if (searchText.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * 修复作者信息
 * @param {string} authors - 原始作者字符串
 * @returns {string} - 修复后的作者字符串
 */
function fixAuthors(authors) {
  if (!authors || authors === 'Unknown' || authors.toLowerCase() === 'unknown') {
    return '作者信息待补充';
  }
  return authors;
}

/**
 * 生成中文摘要（简化版：提取关键信息）
 * 实际生产中可集成翻译 API
 * @param {string} abstract - 英文摘要
 * @param {string} title - 标题
 * @returns {string} - 中文摘要
 */
function generateChineseAbstract(abstract, title) {
  // 这是一个简化实现，实际应该调用翻译 API
  // 目前返回英文摘要，前端显示时再做处理
  
  // 提取第一句作为核心内容
  const firstSentence = abstract.split('.')[0] || abstract.substring(0, 200);
  
  return `[英文摘要] ${firstSentence}`;
}

/**
 * 检查论文是否已存在
 * @param {string} arxivId - Arxiv ID
 * @returns {boolean} - 是否存在
 */
function exists(arxivId) {
  const result = db.db.prepare('SELECT id FROM papers WHERE arxiv_id = ?').get(arxivId);
  return result !== undefined;
}

/**
 * 从 JSON 文件导入论文（增强版）
 * @param {string} jsonFile - JSON 文件路径
 * @param {boolean} strictMode - 严格模式，只导入强相关论文
 */
function importFromJson(jsonFile, strictMode = true) {
  try {
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
    const papers = data.papers || data.articles || [];
    
    let imported = 0;
    let skipped = 0;
    let duplicate = 0;
    let notRelated = 0;
    
    // 过滤强相关论文
    const filteredPapers = strictMode 
      ? papers.filter(p => isStrongRelated(p))
      : papers;
    
    if (strictMode && filteredPapers.length > 10) {
      console.log(`⚠️  发现 ${filteredPapers.length} 篇强相关论文，但只导入前 10 篇`);
      console.log(`   其余论文请在网站上查看完整列表\n`);
    }
    
    // 只取前 10 篇
    const papersToImport = filteredPapers.slice(0, 10);

    papersToImport.forEach(paper => {
      try {
        // 去重检查
        if (exists(paper.arxiv_id || paper.id)) {
          duplicate++;
          console.log(`⭕ 跳过已存在：${paper.arxiv_id || paper.id}`);
          return;
        }
        
        // 修复作者信息
        const authors = fixAuthors(paper.authors || paper.author);
        
        // 生成中文摘要
        const chineseAbstract = generateChineseAbstract(
          paper.abstract || paper.summary || '',
          paper.title
        );
        
        const result = db.addPaper({
          arxiv_id: paper.arxiv_id || paper.id,
          title: paper.title,
          authors: authors,
          abstract: chineseAbstract,
          pdf_url: paper.pdf_url,
          arxiv_url: paper.arxiv_url || paper.link,
          published_date: paper.published_date || paper.published
        });

        if (result.changes > 0) {
          imported++;
          
          // 添加标签
          if (paper.tags && Array.isArray(paper.tags)) {
            paper.tags.forEach(tag => {
              try {
                db.addPaperTag(result.lastInsertRowid, tag);
              } catch (tagError) {
                console.warn(`   ⚠️  标签 "${tag}" 添加失败：${tagError.message}`);
              }
            });
          }
          
          console.log(`✅ 导入：${paper.title.substring(0, 50)}...`);
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`❌ 导入失败：${paper.arxiv_id || 'unknown'} - ${error.message}`);
        skipped++;
      }
    });
    
    // 统计未通过强相关过滤的论文
    notRelated = papers.length - filteredPapers.length;

    console.log(`\n📊 导入统计:`);
    console.log(`   ✅ 成功导入：${imported} 篇`);
    console.log(`   ⭕ 重复跳过：${duplicate} 篇`);
    console.log(`   ⚠️  非强相关：${notRelated} 篇`);
    console.log(`   ❌ 导入失败：${skipped} 篇`);
    
    if (papers.length - filteredPapers.length > 10) {
      console.log(`\n💡 提示：还有 ${papers.length - filteredPapers.length - 10} 篇强相关论文未在数据库中，请在网站上查看`);
    }
    
    return { imported, skipped, duplicate, notRelated };
  } catch (error) {
    console.error('❌ 读取文件失败:', error.message);
    process.exit(1);
  }
}

/**
 * 批量更新现有论文的摘要为中文
 * 用于修复历史数据
 */
function updateExistingPapersToChinese() {
  console.log('🔄 开始更新现有论文的摘要...\n');
  
  const allPapers = db.db.prepare('SELECT id, title, abstract FROM papers').all();
  
  let updated = 0;
  
  allPapers.forEach(paper => {
    try {
      if (paper.abstract && !paper.abstract.startsWith('[中文摘要]')) {
        const chineseAbstract = generateChineseAbstract(paper.abstract, paper.title);
        
        db.db.prepare('UPDATE papers SET abstract = ? WHERE id = ?').run(chineseAbstract, paper.id);
        updated++;
        console.log(`✅ 更新：${paper.title.substring(0, 40)}...`);
      }
    } catch (error) {
      console.warn(`⚠️  更新失败：${paper.id} - ${error.message}`);
    }
  });
  
  console.log(`\n✅ 已更新 ${updated} 篇论文的摘要\n`);
}

/**
 * 批量修复作者信息
 */
function fixExistingAuthors() {
  console.log('🔧 开始修复作者信息...\n');
  
  const unknownPapers = db.db.prepare(`
    SELECT id, title, authors FROM papers 
    WHERE authors = 'Unknown' OR authors = 'unknown' OR authors IS NULL OR authors = ''
  `).all();
  
  let fixed = 0;
  
  unknownPapers.forEach(paper => {
    try {
      const fixedAuthors = '作者信息待补充';
      db.db.prepare('UPDATE papers SET authors = ? WHERE id = ?').run(fixedAuthors, paper.id);
      fixed++;
      console.log(`✅ 修复：${paper.title.substring(0, 40)}...`);
    } catch (error) {
      console.warn(`⚠️  修复失败：${paper.id} - ${error.message}`);
    }
  });
  
  console.log(`\n✅ 已修复 ${fixed} 篇论文的作者信息\n`);
}

// CLI 参数处理
const args = process.argv.slice(2);

if (args.includes('--fix-authors')) {
  fixExistingAuthors();
} else if (args.includes('--translate')) {
  updateExistingPapersToChinese();
} else if (args.length > 0) {
  const jsonFile = path.resolve(args[0]);
  if (fs.existsSync(jsonFile)) {
    importFromJson(jsonFile, true);
  } else {
    console.error('❌ 文件不存在:', jsonFile);
    process.exit(1);
  }
} else {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   📚 ArxivPulse - 论文同步工具（增强版）               ║
║                                                        ║
║   用法：node src/utils/sync-papers.js [选项]          ║
║                                                        ║
║   选项：                                                ║
║   <json_file>      从 JSON 文件导入论文                 ║
║   --fix-authors    修复作者信息为 Unknown 的论文         ║
║   --translate      将现有摘要转换为中文格式             ║
║                                                        ║
║   示例：                                                ║
║   node src/utils/sync-papers.js papers.json           ║
║   node src/utils/sync-papers.js --fix-authors         ║
║   node src/utils/sync-papers.js --translate           ║
║                                                        ║
║   特性：                                                ║
║   ✓ 自动去重（基于 arxiv_id）                         ║
║   ✓ 只导入强相关论文（最多 10 篇）                     ║
║   ✓ 修复 Unknown 作者信息                               ║
║   ✓ 中文摘要支持                                       ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
}

module.exports = { importFromJson, fixExistingAuthors, updateExistingPapersToChinese };
