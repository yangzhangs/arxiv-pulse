/**
 * 从 Arxiv API 获取最近的 cs.SE 论文（最近 7 天）
 */

const http = require('http');
const fs = require('fs');
const path = require('path');

// 计算 7 天前的日期
const today = new Date();
const lastWeek = new Date(today);
lastWeek.setDate(lastWeek.getDate() - 7);

const startDate = lastWeek.toISOString().split('T')[0].replace(/-/g, '');
const endDate = today.toISOString().split('T')[0].replace(/-/g, '');

// Arxiv API 查询 - cs.SE (Software Engineering) 分类，最近 7 天
const query = encodeURIComponent(`cat:cs.SE AND submittedDate:[${startDate}0000 TO ${endDate}2359]`);
const url = `http://export.arxiv.org/api/query?search_query=${query}&start=0&max_results=100&sortBy=submittedDate&sortOrder=descending`;

console.log('📡 正在从 Arxiv API 获取最近 7 天的论文...\n');
console.log(`日期范围：${lastWeek.toISOString().split('T')[0]} 至 ${today.toISOString().split('T')[0]}`);
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
      const idMatch = entry.match(/<id>(.*?)<\/id>/);
      const titleMatch = entry.match(/<title>(.*?)<\/title>/s);
      const summaryMatch = entry.match(/<summary>(.*?)<\/summary>/s);
      const publishedMatch = entry.match(/<published>(.*?)<\/published>/);
      
      const id = idMatch ? idMatch[1] : '';
      const title = titleMatch ? titleMatch[1].replace(/\n/g, ' ').trim() : '';
      const summary = summaryMatch ? summaryMatch[1].replace(/\n/g, ' ').trim() : '';
      const published = publishedMatch ? publishedMatch[1] : '';
      
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
  
  console.log(`\n✅ 成功解析 ${papers.length} 篇论文\n`);
  
  // 保存到 JSON 文件
  const outputPath = path.join(__dirname, '../../data/arxiv-recent.json');
  fs.writeFileSync(outputPath, JSON.stringify({ papers }, null, 2), 'utf-8');
  
  console.log(`💾 已保存到：${outputPath}\n`);
  
  // 按日期分组统计
  const byDate = {};
  papers.forEach(paper => {
    const date = paper.published_date;
    if (!byDate[date]) byDate[date] = 0;
    byDate[date]++;
  });
  
  console.log('📅 按日期分布:');
  Object.keys(byDate).sort().reverse().forEach(date => {
    console.log(`   ${date}: ${byDate[date]} 篇`);
  });
  
  // 显示前 10 篇
  console.log('\n📝 最新 10 篇论文:\n');
  papers.slice(0, 10).forEach((paper, i) => {
    console.log(`${i+1}. [${paper.published_date}] ${paper.title.substring(0, 80)}...`);
    console.log(`   作者：${paper.authors.substring(0, 60)}...`);
    console.log(`   URL: ${paper.arxiv_url}\n`);
  });
  
  console.log(`\n💡 使用以下命令导入到数据库:`);
  console.log(`   node src/utils/sync-papers.js data/arxiv-recent.json\n`);
}
