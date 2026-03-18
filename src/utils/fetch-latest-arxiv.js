/**
 * 获取 Arxiv 最新论文并筛选强相关文章
 * 用法：node src/utils/fetch-latest-arxiv.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 加载集中配置的关键词
const keywords = require('../config/keywords');
const KEYWORDS = keywords.en;
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
  const seenIds = new Set(); // 去重机制：记录已处理的 arxiv_id
  
  entries.forEach((entry, index) => {
    if (index === 0) return;
    
    try {
      const id = entry.match(/<id>(.*?)<\/id>/)?.[1] || '';
      const title = entry.match(/<title>(.*?)<\/title>/s)?.[1]?.replace(/\n/g, ' ').trim() || '';
      const summary = entry.match(/<summary>(.*?)<\/summary>/s)?.[1]?.replace(/\n/g, ' ').trim() || '';
      const published = entry.match(/<published>(.*?)<\/published>/)?.[1] || '';
      
      // 提取 comment 字段（包含 accepted 信息）
      const commentMatch = entry.match(/<arxiv:comment[^>]*>(.*?)<\/arxiv:comment>/s);
      const comment = commentMatch?.[1]?.replace(/\n/g, ' ').trim() || '';
      
      // 修复作者信息解析（支持多行 XML + 命名空间）
      const authorMatches = entry.matchAll(/<author>[\s\S]*?<name>(.*?)<\/name>[\s\S]*?<\/author>/g);
      const authors = Array.from(authorMatches).map(m => m[1]).join(', ');
      
      const arxivId = id.split('/abs/').pop() || id.split('/').pop();
      
      // 去重检查：跳过已存在的论文
      if (seenIds.has(arxivId)) {
        console.log(`⚠️  跳过重复论文: ${arxivId}`);
        return;
      }
      seenIds.add(arxivId);
      
      if (title && arxivId) {
        const paper = {
          arxiv_id: arxivId,
          title,
          authors: authors || 'Unknown',
          abstract: summary,
          pdf_url: `https://arxiv.org/pdf/${arxivId}.pdf`,
          arxiv_url: `https://arxiv.org/abs/${arxivId}`,
          published_date: published.split('T')[0],
          comment: comment // 添加 comment 字段
        };
        
        // 提取 accepted 信息
        const acceptedInfo = extractAcceptedInfo(comment);
        if (acceptedInfo) {
          paper.accepted_venue = acceptedInfo;
        }
        
        papers.push(paper);
        
        // 检查是否强相关 - 仅匹配标题中的关键词
        const titleLower = title.toLowerCase();
        const isRelated = KEYWORDS.some(kw => titleLower.includes(kw.toLowerCase()));
        
        if (isRelated) {
          paper.tags = extractTags(titleLower);
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

function extractTags(title) {
  const tags = [];
  const seenTags = new Set(); // 去重集合
  
  for (const [kw, tag] of Object.entries(TAG_MAP)) {
    if (title.includes(kw.toLowerCase()) && !seenTags.has(tag)) {
      tags.push(tag);
      seenTags.add(tag);
    }
  }
  
  return tags.length > 0 ? tags : ['cs.SE'];
}

// 从 comment 中提取 accepted 信息
function extractAcceptedInfo(comment) {
  if (!comment) return null;
  
  const lowerComment = comment.toLowerCase();
  
  // 检查是否包含 accepted 关键词
  if (!lowerComment.includes('accepted')) {
    return null;
  }
  
  // 尝试提取会议/期刊名称的常见模式
  const patterns = [
    // Accepted at/to/by XXX
    /accepted\s+(?:at|to|by)\s+([^,.]+)/i,
    // Accepted for publication in/at XXX
    /accepted\s+for\s+publication\s+(?:in|at)\s+([^,.]+)/i,
    // Accepted to appear in XXX
    /accepted\s+to\s+appear\s+(?:in|at)\s+([^,.]+)/i,
    // Accepted by XXX
    /accepted\s+by\s+([^,.]+)/i,
    // Accepted, XXX
    /accepted[,;]\s+([^,.]+)/i
  ];
  
  for (const pattern of patterns) {
    const match = comment.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  // 如果没有匹配到具体模式，返回 "Accepted"
  return 'Accepted';
}
