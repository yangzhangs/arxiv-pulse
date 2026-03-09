/**
 * 论文同步脚本
 * 用于将 Arxiv 检索结果同步到网站数据库
 * 
 * 用法：node src/utils/sync-papers.js [json_file]
 */

const path = require('path');
const fs = require('fs');
const db = require('../models/database');

// 示例数据结构
const samplePaper = {
  arxiv_id: "2403.12345",
  title: "论文标题",
  authors: "作者 1, 作者 2, 作者 3",
  abstract: "摘要内容...",
  pdf_url: "https://arxiv.org/pdf/2403.12345.pdf",
  arxiv_url: "https://arxiv.org/abs/2403.12345",
  published_date: "2024-03-08",
  tags: ["Docker", "CI/CD"]
};

/**
 * 从 JSON 文件导入论文
 * @param {string} jsonFile - JSON 文件路径
 */
function importFromJson(jsonFile) {
  try {
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
    const papers = data.papers || data.articles || [];
    
    let imported = 0;
    let skipped = 0;

    papers.forEach(paper => {
      try {
        const result = db.addPaper({
          arxiv_id: paper.arxiv_id || paper.id,
          title: paper.title,
          authors: paper.authors || paper.author,
          abstract: paper.abstract || paper.summary,
          pdf_url: paper.pdf_url,
          arxiv_url: paper.arxiv_url || paper.link,
          published_date: paper.published_date || paper.published
        });

        if (result.changes > 0) {
          imported++;
          // 添加标签
          if (paper.tags && Array.isArray(paper.tags)) {
            paper.tags.forEach(tag => db.addPaperTag(result.lastInsertRowid, tag));
          }
        } else {
          skipped++;
        }
      } catch (error) {
        console.error('❌ 导入失败:', paper.arxiv_id, error.message);
        skipped++;
      }
    });

    console.log(`✅ 导入完成：${imported} 篇成功，${skipped} 篇跳过`);
    return { imported, skipped };
  } catch (error) {
    console.error('❌ 读取文件失败:', error.message);
    process.exit(1);
  }
}

/**
 * 从 Arxiv API 获取论文（未来扩展）
 */
async function fetchFromArxiv() {
  // TODO: 实现 Arxiv API 调用
  console.log('📡 从 Arxiv API 获取论文...');
}

// CLI 参数处理
const args = process.argv.slice(2);
if (args.length > 0) {
  const jsonFile = path.resolve(args[0]);
  if (fs.existsSync(jsonFile)) {
    importFromJson(jsonFile);
  } else {
    console.error('❌ 文件不存在:', jsonFile);
    process.exit(1);
  }
} else {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   📚 ArxivPulse - 论文同步工具                         ║
║                                                        ║
║   用法：node src/utils/sync-papers.js [json_file]     ║
║                                                        ║
║   示例：                                                ║
║   node src/utils/sync-papers.js papers.json           ║
║                                                        ║
║   如果没有提供文件，将等待定时任务推送数据              ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
}

module.exports = { importFromJson, fetchFromArxiv };
