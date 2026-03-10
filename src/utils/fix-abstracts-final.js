/**
 * 最终修复摘要 - 使用正确的 ID 映射
 */

const db = require('../models/database');

console.log('🔧 最终修复摘要数据...\n');

const papers = [
  {
    id: 4,
    title: 'Tool-Genesis',
    en: 'Research on self-evolving language agents progresses, increasing attention has focused on their ability to create, adapt, and maintain tools from task requirements...',
    cn: '随着自进化语言代理研究的进展，越来越多的关注集中在它们根据任务要求创建、适应和维护工具的能力上...'
  },
  {
    id: 5,
    title: 'EigenData',
    en: 'Function-calling agents—large language models that invoke tools and APIs—require high-quality, domain-specific training data...',
    cn: '函数调用代理（调用工具和 API 的大型语言模型）需要高质量、特定领域的训练数据...'
  },
  {
    id: 6,
    title: 'Balancing Latency',
    en: 'Line-level code completion aims to complete the current line in real-time as developers type. We propose a cascading approach balancing latency and accuracy...',
    cn: '行级代码补全旨在在开发人员输入时实时完成当前行。我们提出了一种平衡延迟和准确性的级联方法...'
  },
  {
    id: 7,
    title: 'XAI for Coding',
    en: 'Explainable AI (XAI) techniques can help diagnose coding agent failures by transforming raw execution traces into interpretable feedback...',
    cn: '可解释 AI（XAI）技术可以通过将原始执行轨迹转换为可解释的反馈来帮助诊断编码代理故障...'
  },
  {
    id: 8,
    title: 'MCP Faults',
    en: 'Model Context Protocol (MCP) enables LLMs to interact with external tools and data sources through a standardized interface. We identify common faults...',
    cn: '模型上下文协议（MCP）使大型语言模型能够通过标准化接口与外部工具和数据源交互。我们识别了常见故障...'
  },
  {
    id: 9,
    title: 'Repository Benchmark',
    en: 'Repository-oriented long-context code completion requires understanding the entire codebase structure and dependencies. We present a new benchmark...',
    cn: '面向仓库的长上下文代码补全需要理解整个代码库结构和依赖关系。我们提出了一个新的基准测试...'
  }
];

let updated = 0;

papers.forEach(paper => {
  const newAbstract = `[EN] ${paper.en}\n\n[CN] ${paper.cn}`;
  
  db.db.prepare('UPDATE papers SET abstract = ? WHERE id = ?').run(newAbstract, paper.id);
  updated++;
  console.log(`✅ ${paper.title}: 已更新`);
});

console.log(`\n📊 已更新 ${updated} 篇论文的摘要\n`);

// 验证结果
const samples = db.db.prepare('SELECT id, title, abstract FROM papers ORDER BY id LIMIT 3').all();
console.log('📝 验证结果:\n');
samples.forEach((paper, i) => {
  console.log(`${i+1}. ID ${paper.id}: ${paper.title.substring(0, 40)}...`);
  const lines = paper.abstract.split('\n');
  console.log(`   ${lines[0]}`);
  console.log(`   ${lines[2]}\n`);
});
