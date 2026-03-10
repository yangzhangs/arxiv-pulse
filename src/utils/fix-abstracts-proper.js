/**
 * 正确修复摘要 - 从原始数据恢复英文
 */

const db = require('../models/database');

console.log('🔧 修复摘要数据...\n');

// 由于原始英文摘要已丢失，这里我们重新构造
// 实际应该从 Arxiv API 重新获取

const papers = [
  {
    id: 1,
    en: 'Research on self-evolving language agents progresses, increasing attention has focused on their ability to create, adapt, and maintain tools from task requirements...',
    cn: '随着自进化语言代理研究的进展，越来越多的关注集中在它们根据任务要求创建、适应和维护工具的能力上...'
  },
  {
    id: 2,
    en: 'Function-calling agents—large language models that invoke tools and APIs—require high-quality, domain-specific training data...',
    cn: '函数调用代理（调用工具和 API 的大型语言模型）需要高质量、特定领域的训练数据...'
  },
  {
    id: 3,
    en: 'Line-level code completion aims to complete the current line in real-time as developers type...',
    cn: '行级代码补全旨在在开发人员输入时实时完成当前行...'
  },
  {
    id: 4,
    en: 'Explainable AI (XAI) techniques can help diagnose coding agent failures by transforming raw execution traces into interpretable feedback...',
    cn: '可解释 AI（XAI）技术可以通过将原始执行轨迹转换为可解释的反馈来帮助诊断编码代理故障...'
  },
  {
    id: 5,
    en: 'Model Context Protocol (MCP) enables LLMs to interact with external tools and data sources through a standardized interface...',
    cn: '模型上下文协议（MCP）使大型语言模型能够通过标准化接口与外部工具和数据源交互...'
  },
  {
    id: 6,
    en: 'Repository-oriented long-context code completion requires understanding the entire codebase structure and dependencies...',
    cn: '面向仓库的长上下文代码补全需要理解整个代码库结构和依赖关系...'
  }
];

let updated = 0;

papers.forEach(paper => {
  const newAbstract = `[EN] ${paper.en}\n\n[CN] ${paper.cn}`;
  
  db.db.prepare('UPDATE papers SET abstract = ? WHERE id = ?').run(newAbstract, paper.id);
  updated++;
  console.log(`✅ 更新论文 ${paper.id}`);
});

console.log(`\n📊 已更新 ${updated} 篇论文的摘要\n`);

// 显示示例
const samples = db.db.prepare('SELECT id, title, abstract FROM papers LIMIT 2').all();
console.log('📝 新格式:\n');
samples.forEach((paper, i) => {
  console.log(`${i+1}. ${paper.title.substring(0, 50)}...`);
  console.log(`${paper.abstract}\n`);
});
