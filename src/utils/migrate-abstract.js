/**
 * 数据库迁移：添加 chinese_abstract 字段并翻译
 */

const Database = require('better-sqlite3');
const path = require('path');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '../../data/arxiv-pulse.db');
const db = new Database(DB_PATH);

console.log('🔍 检查 papers 表结构...');

// 添加 chinese_abstract 字段
try {
  db.exec('ALTER TABLE papers ADD COLUMN chinese_abstract TEXT');
  console.log('✅ 添加 chinese_abstract 字段');
} catch (e) {
  if (e.message.includes('duplicate column')) {
    console.log('ℹ️  chinese_abstract 字段已存在');
  } else {
    throw e;
  }
}

// 翻译现有论文摘要
const papers = db.prepare('SELECT id, abstract FROM papers WHERE chinese_abstract IS NULL').all();
console.log(`📝 待翻译论文：${papers.length} 篇`);

const translate = async (text) => {
  const cleanText = text.replace(/^\[中文摘要\]\s*/, '').trim();
  try {
    const response = await fetch(`https://api.mymemory.translated.net/get?q=${encodeURIComponent(cleanText)}&langpair=en|zh`);
    const data = await response.json();
    return data.responseData?.translatedText || cleanText;
  } catch (e) {
    console.error('翻译失败:', e.message);
    return cleanText;
  }
};

// 检测是否已是中文（检查内容而非前缀）
const isChinese = (text) => {
  const content = text.replace(/^\[中文摘要\]\s*/, '').trim();
  // 检测中文字符占比
  const chineseChars = content.match(/[\u4e00-\u9fa5]/g);
  return chineseChars && chineseChars.length > 10;
};

// 批量翻译
(async () => {
  const update = db.prepare('UPDATE papers SET chinese_abstract = ? WHERE id = ?');
  
  for (const paper of papers) {
    const cleanAbstract = paper.abstract.replace(/^\[中文摘要\]\s*/, '').trim();
    
    // 跳过已是中文的摘要
    if (isChinese(paper.abstract)) {
      console.log(`⏭️  跳过论文 ${paper.id}（已是中文）`);
      update.run(cleanAbstract, paper.id);
      continue;
    }
    
    console.log(`🔄 翻译论文 ${paper.id}: ${cleanAbstract.substring(0, 50)}...`);
    const translated = await translate(cleanAbstract);
    update.run(translated, paper.id);
    console.log(`✅ 论文 ${paper.id} 翻译完成`);
    
    // API 速率限制：每 2 秒一次
    await new Promise(r => setTimeout(r, 2000));
  }
  
  console.log('✅ 迁移完成');
  db.close();
})();
