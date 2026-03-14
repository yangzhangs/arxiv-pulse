/**
 * 获取 2026-03-11 Arxiv 论文并筛选强相关文章
 * 用法：node src/utils/fetch-arxiv-20260311.js
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

// 强相关关键词（与 sync-papers.js 保持一致）
const KEYWORDS = [
  'Docker', 'CI/CD', 'DevOps', '微服务', '云原生', 
  'Serverless', 'Hugging Face', 'Github Actions', 
  'Agent skills', '弃用包', 'Kubernetes', 'MLOps',
  '容器', '自动化', '持续集成', '持续部署',
  'LLM', 'Agent', 'Agents', '大语言模型', '代理'
];

// 3 月 11 号的 arxiv IDs（从网页提取）
const PAPER_IDS = [
  '2603.09701', '2603.09599', '2603.09497', '2603.09492', '2603.09467',
  '2603.09455', '2603.09335', '2603.09290', '2603.09100', '2603.09035',
  '2603.09029', '2603.09004', '2603.08993', '2603.08951', '2603.08806',
  '2603.09951', '2603.09678', '2603.09134', '2603.09044', '2603.09025',
  '2603.09023', '2603.08852', '2603.08755', '2603.08744', '2603.08738',
  '2603.08721', '2603.08719', '2603.06980'
];

console.log('📡 正在从 Arxiv API 获取 2026-03-11 论文...\n');

const papers = [];
const relatedPapers = [];

let fetched = 0;

function fetchPaper(arxivId) {
  const url = `https://export.arxiv.org/api/query?id_list=${arxivId}`;
  
  https.get(url, (res) => {
    let data = '';
    
    res.on('data', (chunk) => {
      data += chunk;
    });
    
    res.on('end', () => {
      try {
        const entry = data.split('<entry>')[1];
        if (!entry) {
          console.warn(`⚠️  无数据：${arxivId}`);
          return;
        }
        
        const id = entry.match(/<id>(.*?)<\/id>/)?.[1] || '';
        const title = entry.match(/<title>(.*?)<\/title>/s)?.[1]?.replace(/\n/g, ' ').trim() || '';
        const summary = entry.match(/<summary>(.*?)<\/summary>/s)?.[1]?.replace(/\n/g, ' ').trim() || '';
        const published = entry.match(/<published>(.*?)<\/published>/)?.[1] || '';
        
        const authorMatches = entry.matchAll(/<author><name>(.*?)<\/name><\/author>/g);
        const authors = Array.from(authorMatches).map(m => m[1]).join(', ');
        
        const paperArxivId = id.split('/abs/').pop() || id.split('/').pop();
        
        if (title && paperArxivId) {
          const paper = {
            arxiv_id: paperArxivId,
            title,
            authors: authors || 'Unknown',
            abstract: summary,
            pdf_url: `https://arxiv.org/pdf/${paperArxivId}.pdf`,
            arxiv_url: `https://arxiv.org/abs/${paperArxivId}`,
            published_date: published.split('T')[0]
          };
          
          papers.push(paper);
          
          // 检查是否强相关
          const searchText = `${title} ${summary}`.toLowerCase();
          const isRelated = KEYWORDS.some(kw => searchText.includes(kw.toLowerCase()));
          
          if (isRelated) {
            paper.tags = extractTags(searchText);
            relatedPapers.push(paper);
            console.log(`✅ 强相关：${title.substring(0, 50)}...`);
          }
        }
      } catch (error) {
        console.warn(`⚠️  解析失败 ${arxivId}: ${error.message}`);
      }
      
      fetched++;
      if (fetched >= PAPER_IDS.length) {
        saveResults();
      }
    });
  }).on('error', (error) => {
    console.error(`❌ 请求失败 ${arxivId}: ${error.message}`);
    fetched++;
    if (fetched >= PAPER_IDS.length) {
      saveResults();
    }
  });
}

function extractTags(text) {
  const tags = [];
  const tagMap = {
    'Docker': 'Docker',
    'CI/CD': 'CI/CD',
    'DevOps': 'DevOps',
    '微服务': '微服务',
    '云原生': '云原生',
    'Serverless': 'Serverless',
    'Hugging Face': 'Hugging Face',
    'Github Actions': 'Github Actions',
    'GitHub Actions': 'Github Actions',
    'Agent': 'Agent skills',
    'Agents': 'Agent skills',
    'Kubernetes': '云原生',
    'MLOps': 'MLOps',
    '容器': 'Docker',
    'LLM': 'Agent skills',
    '大语言模型': 'Agent skills',
    '代理': 'Agent skills'
  };
  
  for (const [kw, tag] of Object.entries(tagMap)) {
    if (text.toLowerCase().includes(kw.toLowerCase())) {
      tags.push(tag);
    }
  }
  
  return tags.length > 0 ? tags : ['cs.SE'];
}

function saveResults() {
  console.log(`\n✅ 获取到 ${papers.length} 篇论文`);
  console.log(`✅ 其中 ${relatedPapers.length} 篇强相关\n`);
  
  // 保存所有论文
  const allPath = path.join(__dirname, '../../data/arxiv-20260311-all.json');
  fs.writeFileSync(allPath, JSON.stringify({ papers }, null, 2), 'utf-8');
  console.log(`💾 全部论文：${allPath}`);
  
  // 保存强相关论文
  const relatedPath = path.join(__dirname, '../../data/arxiv-20260311.json');
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
    console.log(`   node src/utils/sync-papers.js data/arxiv-20260311.json\n`);
  } else {
    console.log('⚠️  没有找到强相关论文\n');
  }
}

// 开始获取所有论文
PAPER_IDS.forEach((id, i) => {
  console.log(`[${i+1}/${PAPER_IDS.length}] 获取 ${id}...`);
  fetchPaper(id);
});
