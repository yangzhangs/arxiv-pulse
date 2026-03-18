/**
 * 更新现有论文的中文摘要
 */

const path = require('path');
const db = require(path.join(__dirname, '../models/database'));

// 扩展术语映射表
const termMap = {
  // 基础术语
  'cloud-native': '云原生',
  'software delivery': '软件交付',
  'platform': '平台',
  'orchestrate': '编排',
  'release': '发布',
  'complex': '复杂的',
  'multi-stage': '多阶段',
  'pipeline': '流水线',
  'composed of': '由...组成',
  'dozens of': '数十个',
  'independently': '独立地',
  'versioned': '版本化的',
  'task': '任务',
  'code': '代码',
  'test': '测试',
  'production': '生产',
  'correctness': '正确性',
  'maintainability': '可维护性',
  'software development': '软件开发',
  'ensuring': '确保',
  'supporting': '支持',
  'agent skills': '代理技能',
  'structured': '结构化的',
  'procedural knowledge': '程序性知识',
  'packages': '包',
  'injected': '注入',
  'inference time': '推理时',
  'increasingly': ' increasingly',
  'used to': '用于',
  'augment': '增强',
  'LLM agents': '大语言模型代理',
  'software engineering tasks': '软件工程任务',
  'GitHub Actions': 'GitHub Actions',
  'CI/CD': 'CI/CD',
  'DevOps': 'DevOps',
  'microservices': '微服务',
  'serverless': '无服务器',
  'Kubernetes': 'Kubernetes',
  'Docker': 'Docker',
  'container': '容器',
  'automation': '自动化',
  'deployment': '部署',
  'continuous integration': '持续集成',
  'continuous deployment': '持续部署',
  'open source': '开源',
  'API': 'API',
  'framework': '框架',
  'algorithm': '算法',
  'performance': '性能',
  'optimization': '优化',
  'scalability': '可扩展性',
  'reliability': '可靠性',
  'modular': '模块化',
  'architecture': '架构',
  'design pattern': '设计模式',
  'refactoring': '重构',
  'agile': '敏捷',
  'scrum': 'Scrum',
  'user story': '用户故事',
  'requirement': '需求',
  'documentation': '文档',
  'testing': '测试',
  'unit test': '单元测试',
  'integration test': '集成测试',
  'end-to-end test': '端到端测试',
  'regression test': '回归测试',
  'mock': '模拟',
  'dependency': '依赖',
  'injection': '注入',
  'interface': '接口',
  'implementation': '实现',
  'abstraction': '抽象',
  'encapsulation': '封装',
  'inheritance': '继承',
  'polymorphism': '多态',
  'class': '类',
  'object': '对象',
  'method': '方法',
  'function': '函数',
  'variable': '变量',
  'parameter': '参数',
  'return value': '返回值',
  'exception': '异常',
  'error handling': '错误处理',
  'logging': '日志记录',
  'monitoring': '监控',
  'alerting': '告警',
  'observability': '可观测性',
  'trace': '追踪',
  'metrics': '指标',
  'dashboard': '仪表盘',
  'visualization': '可视化',
  'data': '数据',
  'database': '数据库',
  'query': '查询',
  'index': '索引',
  'transaction': '事务',
  'concurrency': '并发',
  'parallel': '并行',
  'asynchronous': '异步',
  'synchronous': '同步',
  'event-driven': '事件驱动',
  'message queue': '消息队列',
  'REST API': 'REST API',
  'WebSocket': 'WebSocket',
  'JSON': 'JSON',
  'XML': 'XML',
  'configuration': '配置',
  'environment': '环境',
  'secret': '密钥',
  'credential': '凭证',
  'authentication': '认证',
  'authorization': '授权',
  'OAuth': 'OAuth',
  'JWT': 'JWT',
  'HTTPS': 'HTTPS',
  'TLS': 'TLS',
  'SSL': 'SSL',
  'certificate': '证书',
  'encryption': '加密',
  'hash': '哈希',
  'signature': '签名',
  'vulnerability': '漏洞',
  'security': '安全',
  'penetration test': '渗透测试',
  'static analysis': '静态分析',
  'dynamic analysis': '动态分析',
  'code coverage': '代码覆盖率',
  'cyclomatic complexity': '圈复杂度',
  'KPI': 'KPI',
  'SLA': 'SLA',
  'SLO': 'SLO',
  'incident': '事件',
  'postmortem': '事后分析',
  'root cause': '根本原因',
  'retrospective': '回顾',
  'sprint': '冲刺',
  'iteration': '迭代',
  'rollback': '回滚',
  'hotfix': '热修复',
  'feature flag': '功能开关',
  'A/B test': 'A/B测试',
  'canary': '金丝雀发布',
  'blue-green': '蓝绿部署'
};

function translateToChinese(text) {
  if (!text) return '';
  
  // 按长度降序排序，避免短词替换影响长词
  const sortedTerms = Object.entries(termMap).sort((a, b) => b[0].length - a[0].length);
  
  let result = text;
  for (const [en, zh] of sortedTerms) {
    const regex = new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    result = result.replace(regex, zh);
  }
  
  return result;
}

function generateChineseAbstract(abstract, title) {
  if (!abstract) return '[中文摘要] 暂无摘要';
  
  // 提取前3句
  const sentences = abstract.split(/\.(\s+|$)/).filter(s => s.trim()).slice(0, 3);
  const coreContent = sentences.join('. ') + (abstract.split(/\.(\s+|$)/).filter(s => s.trim()).length > 3 ? '...' : '');
  
  // 翻译
  const chineseTranslation = translateToChinese(coreContent);
  
  return `[中文摘要] ${chineseTranslation}`;
}

console.log('🔄 开始更新论文中文摘要...\n');

const papers = db.db.prepare('SELECT id, title, abstract FROM papers').all();

let updated = 0;

papers.forEach(paper => {
  try {
    // 只更新以 [中文摘要] 开头但内容仍是英文的摘要
    if (paper.abstract && paper.abstract.startsWith('[中文摘要]')) {
      const englishContent = paper.abstract.replace(/^\[中文摘要\]\s*/, '');
      
      // 检查是否包含中文字符
      if (!/[\u4e00-\u9fa5]/.test(englishContent)) {
        // 需要翻译
        const chineseAbstract = generateChineseAbstract(englishContent, paper.title);
        
        db.db.prepare('UPDATE papers SET abstract = ? WHERE id = ?').run(chineseAbstract, paper.id);
        updated++;
        console.log(`✅ 更新论文 ${paper.id}: ${paper.title.substring(0, 40)}...`);
        console.log(`   新摘要: ${chineseAbstract.substring(0, 80)}...\n`);
      }
    }
  } catch (error) {
    console.error(`❌ 更新失败 ${paper.id}:`, error.message);
  }
});

console.log(`\n📊 更新完成: ${updated} 篇论文已更新中文摘要`);

process.exit(0);
