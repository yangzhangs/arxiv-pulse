/**
 * 修复缺失的 PDF 和 Arxiv URL
 * 根据 arxiv_id 生成标准 URL
 */

const db = require('../models/database');

/**
 * 从 arxiv_id 生成 URL
 * @param {string} arxivId - Arxiv ID (如：2403.12345)
 * @returns {Object} - { pdf_url, arxiv_url }
 */
function generateUrls(arxivId) {
  // 清理 arxiv_id (去除前缀和版本号)
  const cleanId = arxivId.replace(/^arxiv:/i, '').split('v')[0];
  
  return {
    pdf_url: `https://arxiv.org/pdf/${cleanId}.pdf`,
    arxiv_url: `https://arxiv.org/abs/${cleanId}`
  };
}

console.log('🔧 开始修复缺失的 URL...\n');

// 获取所有缺失 URL 的论文
const papersWithoutUrls = db.db.prepare(`
  SELECT id, arxiv_id, title, pdf_url, arxiv_url
  FROM papers
  WHERE pdf_url IS NULL OR pdf_url = '' OR arxiv_url IS NULL OR arxiv_url = ''
`).all();

console.log(`📄 找到 ${papersWithoutUrls.length} 篇缺失 URL 的论文\n`);

let fixed = 0;
let skipped = 0;

papersWithoutUrls.forEach(paper => {
  try {
    if (!paper.arxiv_id) {
      console.log(`⭕ 跳过 (无 arxiv_id): ${paper.title.substring(0, 50)}...`);
      skipped++;
      return;
    }
    
    const urls = generateUrls(paper.arxiv_id);
    
    db.db.prepare(`
      UPDATE papers 
      SET pdf_url = ?, arxiv_url = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(urls.pdf_url, urls.arxiv_url, paper.id);
    
    fixed++;
    console.log(`✅ ${paper.title.substring(0, 50)}...`);
    console.log(`   PDF: ${urls.pdf_url}`);
    console.log(`   Arxiv: ${urls.arxiv_url}`);
  } catch (error) {
    console.error(`❌ 修复失败：${paper.id} - ${error.message}`);
    skipped++;
  }
});

console.log(`\n📊 统计:`);
console.log(`   ✅ 已修复：${fixed} 篇`);
console.log(`   ⭕ 跳过：${skipped} 篇`);
console.log(`\n✅ URL 修复完成\n`);
