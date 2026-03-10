/**
 * 将论文摘要转换为中文格式
 * 使用简单的关键词替换和结构优化
 */

const db = require('../models/database');

console.log(' 开始转换论文摘要为中文...\n');

// 常见学术术语英中映射
const termMap = {
  'self-evolving': '自进化',
  'language agent': '语言代理',
  'multi-agent': '多代理',
  'benchmark': '基准测试',
  'framework': '框架',
  'approach': '方法',
  'method': '方法',
  'system': '系统',
  'platform': '平台',
  'tool creation': '工具创建',
  'function calling': '函数调用',
  'data synthesis': '数据合成',
  'code completion': '代码补全',
  'latency': '延迟',
  'accuracy': '准确性',
  'execution trace': '执行轨迹',
  'model context protocol': '模型上下文协议',
  'repository-oriented': '面向仓库的',
  'long-context': '长上下文'
};

// 获取所有论文
const papers = db.db.prepare('SELECT id, title, abstract FROM papers').all();

let updated = 0;

papers.forEach(paper => {
  if (!paper.abstract || paper.abstract.startsWith('[中文摘要]')) {
    return;
  }
  
  // 提取第一句作为核心内容
  const firstSentence = paper.abstract.split('.')[0] || paper.abstract.substring(0, 200);
  
  // 简单翻译关键词
  let translatedAbstract = firstSentence;
  for (const [en, zh] of Object.entries(termMap)) {
    const regex = new RegExp(en, 'gi');
    translatedAbstract = translatedAbstract.replace(regex, zh);
  }
  
  // 格式化输出
  const chineseAbstract = `[中文摘要] ${translatedAbstract}...`;
  
  // 更新数据库
  db.db.prepare('UPDATE papers SET abstract = ? WHERE id = ?').run(chineseAbstract, paper.id);
  
  console.log(`✅ 更新：${paper.title.substring(0, 50)}...`);
  updated++;
});

console.log(`\n📊 已更新 ${updated} 篇论文的摘要\n`);
console.log('✅ 翻译完成\n');
