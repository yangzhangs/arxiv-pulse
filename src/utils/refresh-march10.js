/**
 * 重新获取 3 月 10 日论文并修复数据库
 * 用法：node src/utils/refresh-march10.js
 */

const https = require('https');
const db = require('../models/database');
const fs = require('fs');
const path = require('path');

// 强相关关键词（必须精确匹配）
const KEYWORDS = [
  'Docker', 'CI/CD', 'DevOps', 'Serverless', 'Hugging Face', 
  'Github Actions', 'GitHub Actions', 'Agent', 'Kubernetes', 'MLOps',
  '微服务', '云原生', '容器', '自动化', '持续集成', '持续部署',
  'LLM', 'LLM Agent', 'Code Agent', 'AI Agent'
];

// 3 月 10 日的论文 ID 列表（从 arxiv 网站获取）
const MARCH10_PAPER_IDS = [
  '2603.08640', '2603.08616', '2603.08372', '2603.08190', '2603.08165',
  '2603.07927', '2603.07906', '2603.07749', '2603.07668', '2603.07581',
  '2603.07557', '2603.07520', '2603.07421', '2603.07419', '2603.07326',
  '2603.07229', '2603.07091', '2603.07065', '2603.06858', '2603.06847',
  '2603.06739', '2603.06620', '2603.08520', '2603.07919', '2603.07287', '2603.06584'
];

console.log('🔄 开始刷新 3 月 10 日论文数据...\n');

// 1. 清除旧的 3 月 10 日论文
const oldPapers = db.db.prepare('SELECT id FROM papers WHERE published_date = ?').all('2026-03-10');
console.log(`🗑️  删除 ${oldPapers.length} 篇旧的 3 月 10 日论文`);
oldPapers.forEach(p => {
  db.db.prepare('DELETE FROM paper_tags WHERE paper_id = ?').run(p.id);
  db.db.prepare('DELETE FROM papers WHERE id = ?').run(p.id);
});

// 2. 获取每篇论文的详细信息
async function fetchPaperDetails(arxivId) {
  return new Promise((resolve, reject) => {
    const url = `https://arxiv.org/abs/${arxivId}`;
    https.get(url, { timeout: 5000 }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve({ id: arxivId, html: data }));
    }).on('error', reject);
  });
}

// 3. 简单翻译函数（关键词替换）
function simpleTranslate(enText) {
  const translations = {
    'Agent': '代理',
    'Agents': '代理',
    'LLM': '大语言模型',
    'Language Model': '语言模型',
    'Code': '代码',
    'Testing': '测试',
    'CI/CD': '持续集成/持续部署',
    'DevOps': '开发运维',
    'Cloud': '云',
    'Kubernetes': '容器编排',
    'Docker': '容器',
    'Serverless': '无服务器',
    'Microservice': '微服务',
    'Automation': '自动化',
    'Continuous Integration': '持续集成',
    'Continuous Deployment': '持续部署',
    'Software Engineering': '软件工程',
    'AI': '人工智能',
    'Machine Learning': '机器学习',
    'Deep Learning': '深度学习',
    'Neural': '神经',
    'Training': '训练',
    'Benchmark': '基准测试',
    'Framework': '框架',
    'System': '系统',
    'Platform': '平台'
  };
  
  let cnText = enText;
  for (const [en, cn] of Object.entries(translations)) {
    const regex = new RegExp(en, 'gi');
    cnText = cnText.replace(regex, cn);
  }
  
  return cnText.substring(0, 300) + '...';
}

// 4. 检查是否强相关
function isStrongRelated(title, abstract) {
  const text = (title + ' ' + abstract).toLowerCase();
  for (const kw of KEYWORDS) {
    if (text.includes(kw.toLowerCase())) {
      return true;
    }
  }
  return false;
}

// 5. 提取标签
function extractTags(title, abstract) {
  const tags = [];
  const tagMap = {
    'Docker': 'Docker',
    'CI/CD': 'CI/CD',
    'DevOps': 'DevOps',
    'Serverless': 'Serverless',
    'Hugging Face': 'Hugging Face',
    'Github Actions': 'Github Actions',
    'GitHub Actions': 'Github Actions',
    'Agent': 'Agent skills',
    'Kubernetes': '云原生',
    'MLOps': 'MLOps',
    '微服务': '微服务',
    '云原生': '云原生',
    '容器': 'Docker',
    'LLM': 'Agent skills',
    'LLM Agent': 'Agent skills',
    'Code Agent': 'Agent skills',
    'AI Agent': 'Agent skills'
  };
  
  const text = (title + ' ' + abstract).toLowerCase();
  for (const [kw, tag] of Object.entries(tagMap)) {
    if (text.includes(kw.toLowerCase())) {
      tags.push(tag);
    }
  }
  
  return tags;
}

// 主流程
async function main() {
  console.log('📡 获取论文详情...\n');
  
  const relatedPapers = [];
  
  for (const arxivId of MARCH10_PAPER_IDS) {
    try {
      console.log(`  获取：${arxivId}...`);
      const result = await fetchPaperDetails(arxivId);
      
      // 简单解析 HTML 获取标题和摘要
      const titleMatch = result.html.match(/<title>\[(.*?)\](.*?)<\/title>/);
      const title = titleMatch ? titleMatch[2].trim() : arxivId;
      
      const abstractMatch = result.html.match(/<p itemprop="description">(.*?)<\/p>/s);
      const abstract = abstractMatch ? abstractMatch[1].replace(/\n/g, ' ').trim() : '';
      
      // 检查是否强相关
      if (isStrongRelated(title, abstract)) {
        const tags = extractTags(title, abstract);
        const cnAbstract = simpleTranslate(abstract);
        
        relatedPapers.push({
          arxiv_id: arxivId,
          title: title.replace(/:\s*/g, ': '),
          authors: '待提取',
          abstract: `[EN] ${abstract.substring(0, 400)}...\n\n[CN] ${cnAbstract}`,
          pdf_url: `https://arxiv.org/pdf/${arxivId}.pdf`,
          arxiv_url: `https://arxiv.org/abs/${arxivId}`,
          published_date: '2026-03-10',
          tags: tags
        });
        
        console.log(`    ✅ 强相关 - ${title.substring(0, 50)}...`);
        console.log(`    标签：${tags.join(', ')}`);
      } else {
        console.log(`    ⭕ 非强相关，跳过`);
      }
    } catch (error) {
      console.log(`    ❌ 失败：${error.message}`);
    }
  }
  
  console.log(`\n📊 找到 ${relatedPapers.length} 篇强相关论文\n`);
  
  // 6. 导入到数据库
  console.log('💾 导入到数据库...\n');
  
  let imported = 0;
  relatedPapers.forEach(paper => {
    try {
      // 检查是否已存在
      const exists = db.db.prepare('SELECT id FROM papers WHERE arxiv_id = ?').get(paper.arxiv_id);
      if (exists) {
        console.log(`  ⭕ 跳过已存在：${paper.arxiv_id}`);
        return;
      }
      
      // 插入论文
      const result = db.addPaper({
        arxiv_id: paper.arxiv_id,
        title: paper.title,
        authors: paper.authors,
        abstract: paper.abstract,
        pdf_url: paper.pdf_url,
        arxiv_url: paper.arxiv_url,
        published_date: paper.published_date
      });
      
      // 添加标签
      if (paper.tags && paper.tags.length > 0) {
        paper.tags.forEach(tag => {
          try {
            db.addPaperTag(result.lastInsertRowid, tag);
          } catch (e) {
            // 标签可能不存在，跳过
          }
        });
      }
      
      imported++;
      console.log(`  ✅ 导入：${paper.title.substring(0, 50)}...`);
    } catch (error) {
      console.log(`  ❌ 失败：${paper.arxiv_id} - ${error.message}`);
    }
  });
  
  console.log(`\n✅ 完成！导入 ${imported} 篇论文\n`);
  
  // 7. 统计
  const allPapers = db.getAllPapers(1, 100);
  console.log('📈 当前数据库状态:');
  console.log(`   总论文数：${allPapers.pagination.total}`);
  console.log(`   3 月 10 日：${allPapers.papers.filter(p => p.published_date === '2026-03-10').length}`);
  console.log(`   3 月 09 日：${allPapers.papers.filter(p => p.published_date === '2026-03-09').length}`);
}

main().catch(console.error);
