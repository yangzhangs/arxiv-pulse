/**
 * 获取 Arxiv 最新论文并筛选强相关文章
 * 用法：node src/utils/fetch-latest-arxiv.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 加载集中配置的关键词
const keywords = require('../config/keywords');
const KEYWORDS = [...keywords.en, ...keywords.zh];
const TAG_MAP = keywords.tagMap;

console.log('📡 正在从 Arxiv API 获取最新 cs.SE 论文...\n');

const url = 'https://export.arxiv.org/api/query?search_query=cat:cs.SE&start=0&max_results=100&sortBy=submittedDate&sortOrder=descending';

https.get(url, (res) => {
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
  const relatedPapers = [];
  
  entries.forEach((entry, index) => {
    if (index === 0) return;
    
    try {
      const id = entry.match(/<id>(.*?)<\/id>/)?.[1] || '';
      const title = entry.match(/<title>(.*?)<\/title>/s)?.[1]?.replace(/\n/g, ' ').trim() || '';
      const summary = entry.match(/<summary>(.*?)<\/summary>/s)?.[1]?.replace(/\n/g, ' ').trim() || '';
      const published = entry.match(/<published>(.*?)<\/published>/)?.[1] || '';
      
      const authorMatches = entry.matchAll(/<author><name>(.*?)<\/name><\/author>/g);
      const authors = Array.from(authorMatches).map(m => m[1]).join(', ');
      
      const arxivId = id.split('/abs/').pop() || id.split('/').pop();
      
      if (title && arxivId) {
        const paper = {
          arxiv_id: arxivId,
          title,
          authors: authors || 'Unknown',
          abstract: summary,
          pdf_url: `https://arxiv.org/pdf/${arxivId}.pdf`,
          arxiv_url: `https://arxiv.org/abs/${arxivId}`,
          published_date: published.split('T')[0]
        };
        
        papers.push(paper);
        
        // 检查是否强相关
        const searchText = `${title} ${summary}`.toLowerCase();
        const isRelated = KEYWORDS.some(kw => searchText.toLowerCase().includes(kw.toLowerCase()));
        
        if (isRelated) {
          paper.tags = extractTags(searchText);
          relatedPapers.push(paper);
        }
      }
    } catch (error) {
      console.warn(`⚠️  解析 entry 失败：${error.message}`);
    }
  });
  
  console.log(`✅ 获取到 ${papers.length} 篇论文`);
  console.log(`✅ 其中 ${relatedPapers.length} 篇强相关\n`);
  
  // 保存所有论文
  const allPath = path.join(__dirname, '../../data/arxiv-latest-all.json');
  fs.writeFileSync(allPath, JSON.stringify({ papers }, null, 2), 'utf-8');
  console.log(`💾 全部论文：${allPath}`);
  
  // 保存强相关论文
  const relatedPath = path.join(__dirname, '../../data/arxiv-latest-related.json');
  fs.writeFileSync(relatedPath, JSON.stringify({ papers: relatedPapers }, null, 2), 'utf-8');
  console.log(`💾 强相关论文：${relatedPath}\n`);
  
  // 显示强相关论文
  if (relatedPapers.length > 0) {
    console.log('📝 强相关论文列表:\n');
    relatedPapers.forEach((paper, i) => {
      console.log(`${i+1}. ${paper.title.substring(0, 70)}...`);
      console.log(`   日期：${paper.published_date}`);
      console.log(`   标签：${paper.tags?.join(', ')}`);
      console.log(`   URL: ${paper.arxiv_url}\n`);
    });
    
    console.log(`\n💡 导入命令:`);
    console.log(`   node src/utils/sync-papers.js data/arxiv-latest-related.json\n`);
  } else {
    console.log('⚠️  没有找到强相关论文\n');
  }
}

function extractTags(text) {
  const tags = [];
  
  for (const [kw, tag] of Object.entries(TAG_MAP)) {
    if (text.toLowerCase().includes(kw.toLowerCase())) {
      tags.push(tag);
    }
  }
  
  return tags.length > 0 ? tags : ['cs.SE'];
}
