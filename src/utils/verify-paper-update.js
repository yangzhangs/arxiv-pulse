/**
 * 验证论文数据更新
 */

const db = require('../models/database');

console.log('════════════════════════════════════════════════════════');
console.log('           论文数据验证报告');
console.log('════════════════════════════════════════════════════════\n');

const paper = db.db.prepare('SELECT * FROM papers').get();

console.log('📄 论文信息:\n');
console.log(`标题：${paper.title}`);
console.log(`作者：${paper.authors}`);
console.log(`Arxiv ID: ${paper.arxiv_id}`);
console.log(`发布日期：${paper.published_date}`);
console.log('');

console.log('📝 摘要:\n');
const abstract = paper.abstract;
const enPart = abstract.split('[CN]')[0].replace('[EN]', '').trim();
const cnPart = abstract.split('[CN]')[1].trim();

console.log('【英文】');
console.log(enPart.substring(0, 300) + '...\n');

console.log('【中文】');
console.log(cnPart.substring(0, 300) + '...\n');

console.log('🔗 链接:\n');
console.log(`PDF: ${paper.pdf_url}`);
console.log(`Arxiv: ${paper.arxiv_url}`);
console.log('');

console.log('🏷️  标签:\n');
const tags = db.db.prepare(`
  SELECT t.name FROM paper_tags pt JOIN tags t ON pt.tag_id = t.id WHERE pt.paper_id = ?
`).get(paper.id);
console.log(`标签：${tags ? tags.name : '无'}`);
console.log('');

console.log('════════════════════════════════════════════════════════');
console.log('                    ✅ 验证完成');
console.log('════════════════════════════════════════════════════════\n');
