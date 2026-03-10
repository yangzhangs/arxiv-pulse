/**
 * 从 Arxiv API 获取 3 月 9 日的论文
 */

const http = require('http');
const db = require('../models/database');
const fs = require('fs');
const path = require('path');

// Arxiv API 查询 - cs.SE (Software Engineering) 分类，3 月 9 日发布
const query = encodeURIComponent('cat:cs.SE AND submittedDate:[202603090000 TO 202603092359]');
const url = `http://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=50&sortBy=submittedDate&sortOrder=ascending`;

console.log('📡 正在从 Arxiv API 获取 2026-03-09 的论文...\n');
console.log(`查询 URL: ${url}\n`);

http.get(url, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      parseArxivResponse(data);
    } catch (error) {
      console.error('❌ 解析失败:', error.message);
      process.exit(1);
    }
  });
}).on('error', (error) => {
  console.error('❌ 请求失败:', error.message);
  process.exit(1);
});

function parseArxivResponse(xml) {
  const entries = xml.split('<entry>');
  const papers = [];
  
  entries.forEach((entry, index) => {
    if (index === 0) return; // 跳过第一个（header）
    
    try {
      const id = entry.match(/<id>(.*?)<\/id>/)?.[1] || '';
      const title = entry.match(/<title>(.*?)<\/title>/s)?.[1]?.replace(/\n/g, ' ').trim() || '';
      const summary = entry.match(/<summary>(.*?)<\/summary>/s)?.[1]?.replace(/\n/g, ' ').trim() || '';
      const published = entry.match(/<published>(.*?)<\/published>/)?.[1] || '';
      
      // 提取作者
      const authorMatches = entry.matchAll(/<author><name>(.*?)<\/name><\/author>/g);
      const authors = Array.from(authorMatches).map(m => m[1]).join(', ');
      
      // 提取 arxiv ID
      const arxivId = id.split('/abs/').pop() || id.split('/').pop();
      
      if (title && arxivId) {
        papers.push({
          arxiv_id: arxivId,
          title,
          authors: authors || 'Unknown',
          abstract: summary,
          pdf_url: `https://arxiv.org/pdf/${arxivId}.pdf`,
          arxiv_url: `https://arxiv.org/abs/${arxivId}`,
          published_date: published.split('T')[0]
        });
      }
    } catch (error) {
      console.warn(`⚠️  解析 entry 失败：${error.message}`);
    }
  });
  
  console.log(`✅ 成功解析 ${papers.length} 篇论文\n`);
  
  // 保存到 JSON 文件
  const outputPath = path.join(__dirname, '../../data/arxiv-20260309.json');
  fs.writeFileSync(outputPath, JSON.stringify({ papers }, null, 2), 'utf-8');
  
  console.log(`💾 已保存到：${outputPath}\n`);
  
  // 显示前 5 篇
  console.log('📝 前 5 篇论文:\n');
  papers.slice(0, 5).forEach((paper, i) => {
    console.log(`${i+1}. ${paper.title}`);
    console.log(`   作者：${paper.authors}`);
    console.log(`   日期：${paper.published_date}`);
    console.log(`   URL: ${paper.arxiv_url}\n`);
  });
  
  console.log(`\n💡 使用以下命令导入到数据库:`);
  console.log(`   node src/utils/sync-papers.js data/arxiv-20260309.json\n`);
}
