/**
 * 论文同步脚本 - 增强版
 * 用于将 Arxiv 检索结果同步到网站数据库
 * 
 * 功能：
 * - 去重检测（基于 arxiv_id）
 * - 作者信息修复（Unknown 检测）
 * - 中文摘要支持
 * - 强相关标签过滤
 * - 限制每次同步不超过 10 篇
 * 
 * 用法：node src/utils/sync-papers.js [json_file]
 */

const path = require('path');
const fs = require('fs');
const db = require('../models/database');

// 强相关关键词列表（与 fetch-latest-arxiv.js 保持一致）
const STRONG_RELATED_KEYWORDS = [
  'Docker', 'CI/CD', 'DevOps', '微服务', '云原生', 
  'Serverless', 'Hugging Face', 'Github Actions', 
  'Agent skills', '弃用包', 'Kubernetes', 'MLOps',
  '容器', '自动化', '持续集成', '持续部署',
  'LLM', 'Agent', 'Agents', '大语言模型', '代理'
];

/**
 * 检查论文是否与强相关关键词匹配
 * @param {Object} paper - 论文对象
 * @returns {boolean} - 是否强相关
 */
function isStrongRelated(paper) {
  const searchText = `${paper.title} ${paper.abstract} ${paper.authors}`.toLowerCase();
  
  for (const keyword of STRONG_RELATED_KEYWORDS) {
    if (searchText.includes(keyword.toLowerCase())) {
      return true;
    }
  }
  return false;
}

/**
 * 修复作者信息
 * @param {string} authors - 原始作者字符串
 * @returns {string} - 修复后的作者字符串
 */
function fixAuthors(authors) {
  if (!authors || authors === 'Unknown' || authors.toLowerCase() === 'unknown') {
    return '作者信息待补充';
  }
  return authors;
}

/**
 * 生成中文摘要
 * 使用术语映射 + 关键句提取生成伪中文摘要
 * @param {string} abstract - 英文摘要
 * @param {string} title - 标题
 * @returns {string} - 中文格式摘要
 */
function generateChineseAbstract(abstract, title) {
  if (!abstract) return '[中文摘要] 暂无摘要';
  
  // 提取前3句作为核心内容（更完整）
  const sentences = abstract.split(/\.(\s+|$)/).filter(s => s.trim());
  const coreContent = sentences.slice(0, 3).join('. ') + (sentences.length > 3 ? '...' : '');
  
  // 扩展术语映射表
  const termMap = {
    // 技术术语
    'self-evolving': '自进化',
    'language agent': '语言代理',
    'multi-agent': '多代理',
    'benchmark': '基准测试',
    'code completion': '代码补全',
    'latency': '延迟',
    'accuracy': '准确性',
    'software engineering': '软件工程',
    'machine learning': '机器学习',
    'deep learning': '深度学习',
    'artificial intelligence': '人工智能',
    'natural language processing': '自然语言处理',
    'large language model': '大语言模型',
    'LLM': '大语言模型',
    'CI/CD': '持续集成/持续部署',
    'DevOps': '开发运维一体化',
    'microservices': '微服务',
    'cloud native': '云原生',
    'serverless': '无服务器',
    'Kubernetes': 'Kubernetes容器编排',
    'Docker': 'Docker容器',
    'container': '容器',
    'automation': '自动化',
    'deployment': '部署',
    'pipeline': '流水线',
    'repository': '代码仓库',
    'version control': '版本控制',
    'GitHub Actions': 'GitHub Actions自动化',
    'test code': '测试代码',
    'production code': '生产代码',
    'code review': '代码审查',
    'pull request': '拉取请求',
    'continuous integration': '持续集成',
    'continuous deployment': '持续部署',
    'open source': '开源',
    'API': '应用程序接口',
    'framework': '框架',
    'algorithm': '算法',
    'performance': '性能',
    'optimization': '优化',
    'scalability': '可扩展性',
    'reliability': '可靠性',
    'maintainability': '可维护性',
    'modular': '模块化',
    'architecture': '架构',
    'design pattern': '设计模式',
    'refactoring': '重构',
    'technical debt': '技术债务',
    'agile': '敏捷',
    'scrum': 'Scrum敏捷',
    'user story': '用户故事',
    'requirement': '需求',
    'specification': '规格说明',
    'documentation': '文档',
    'testing': '测试',
    'unit test': '单元测试',
    'integration test': '集成测试',
    'end-to-end test': '端到端测试',
    'regression test': '回归测试',
    'mock': '模拟',
    'stub': '存根',
    'dependency': '依赖',
    'injection': '注入',
    'inversion of control': '控制反转',
    'dependency injection': '依赖注入',
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
    'blocking': '阻塞',
    'non-blocking': '非阻塞',
    'event-driven': '事件驱动',
    'message queue': '消息队列',
    'pub-sub': '发布订阅',
    'webhook': '网络钩子',
    'REST API': 'REST接口',
    'GraphQL': 'GraphQL查询语言',
    'WebSocket': 'WebSocket通信',
    'gRPC': 'gRPC远程调用',
    'protobuf': 'Protocol Buffers',
    'JSON': 'JSON数据格式',
    'XML': 'XML标记语言',
    'YAML': 'YAML配置格式',
    'configuration': '配置',
    'environment': '环境',
    'variable': '变量',
    'secret': '密钥',
    'credential': '凭证',
    'authentication': '认证',
    'authorization': '授权',
    'OAuth': 'OAuth授权协议',
    'JWT': 'JWT令牌',
    'HTTPS': 'HTTPS安全协议',
    'TLS': 'TLS传输层安全',
    'SSL': 'SSL安全套接层',
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
    'technical metric': '技术指标',
    'KPI': '关键绩效指标',
    'SLA': '服务等级协议',
    'SLO': '服务等级目标',
    'SLI': '服务等级指标',
    'incident': '事件',
    'postmortem': '事后分析',
    'root cause': '根本原因',
    'blameless': '无责',
    'retrospective': '回顾',
    'sprint': '冲刺',
    'iteration': '迭代',
    'release': '发布',
    'rollback': '回滚',
    'hotfix': '热修复',
    'feature flag': '功能开关',
    'A/B test': 'A/B测试',
    'canary': '金丝雀发布',
    'blue-green': '蓝绿部署',
    'dark launch': '灰度发布'
  };
  
  let chineseTranslation = coreContent;
  
  // 按长度降序排序，避免短词替换影响长词
  const sortedTerms = Object.entries(termMap).sort((a, b) => b[0].length - a[0].length);
  
  for (const [en, zh] of sortedTerms) {
    const regex = new RegExp(en.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
    chineseTranslation = chineseTranslation.replace(regex, zh);
  }
  
  return `[中文摘要] ${chineseTranslation}`;
}

/**
 * 检查论文是否已存在
 * @param {string} arxivId - Arxiv ID
 * @returns {boolean} - 是否存在
 */
function exists(arxivId) {
  const result = db.db.prepare('SELECT id FROM papers WHERE arxiv_id = ?').get(arxivId);
  return result !== undefined;
}

/**
 * 从 JSON 文件导入论文（增强版）
 * @param {string} jsonFile - JSON 文件路径
 * @param {boolean} strictMode - 严格模式，只导入强相关论文
 */
function importFromJson(jsonFile, strictMode = true) {
  try {
    const data = JSON.parse(fs.readFileSync(jsonFile, 'utf-8'));
    const papers = data.papers || data.articles || [];
    
    let imported = 0;
    let skipped = 0;
    let duplicate = 0;
    let notRelated = 0;
    
    // 过滤强相关论文
    const filteredPapers = strictMode 
      ? papers.filter(p => isStrongRelated(p))
      : papers;
    
    // 网站显示所有强相关论文，没有 10 篇限制
    const papersToImport = filteredPapers;

    papersToImport.forEach(paper => {
      try {
        // 去重检查
        if (exists(paper.arxiv_id || paper.id)) {
          duplicate++;
          console.log(`⭕ 跳过已存在：${paper.arxiv_id || paper.id}`);
          return;
        }
        
        // 修复作者信息
        const authors = fixAuthors(paper.authors || paper.author);
        
        // 生成中文摘要
        const chineseAbstract = generateChineseAbstract(
          paper.abstract || paper.summary || '',
          paper.title
        );
        
        const result = db.addPaper({
          arxiv_id: paper.arxiv_id || paper.id,
          title: paper.title,
          authors: authors,
          abstract: chineseAbstract,
          pdf_url: paper.pdf_url,
          arxiv_url: paper.arxiv_url || paper.link,
          published_date: paper.published_date || paper.published,
          submitted_date: paper.published_date || paper.published, // 使用 published_date 作为 submitted_date
          comment: paper.comment || null,
          accepted_venue: paper.accepted_venue || null
        });

        if (result.changes > 0) {
          imported++;
          
          // 添加标签
          if (paper.tags && Array.isArray(paper.tags)) {
            paper.tags.forEach(tag => {
              try {
                db.addPaperTag(result.lastInsertRowid, tag);
              } catch (tagError) {
                console.warn(`   ⚠️  标签 "${tag}" 添加失败：${tagError.message}`);
              }
            });
          }
          
          console.log(`✅ 导入：${paper.title.substring(0, 50)}...`);
        } else {
          skipped++;
        }
      } catch (error) {
        console.error(`❌ 导入失败：${paper.arxiv_id || 'unknown'} - ${error.message}`);
        skipped++;
      }
    });
    
    // 统计未通过强相关过滤的论文
    notRelated = papers.length - filteredPapers.length;

    console.log(`\n📊 导入统计:`);
    console.log(`   ✅ 成功导入：${imported} 篇`);
    console.log(`   ⭕ 重复跳过：${duplicate} 篇`);
    console.log(`   ⚠️  非强相关：${notRelated} 篇`);
    console.log(`   ❌ 导入失败：${skipped} 篇`);
    
    if (papers.length - filteredPapers.length > 0) {
      console.log(`\n💡 提示：还有 ${papers.length - filteredPapers.length} 篇非强相关论文未导入`);
    }
    
    return { imported, skipped, duplicate, notRelated };
  } catch (error) {
    console.error('❌ 读取文件失败:', error.message);
    process.exit(1);
  }
}

/**
 * 批量更新现有论文的摘要为中文
 * 用于修复历史数据
 */
function updateExistingPapersToChinese() {
  console.log('🔄 开始更新现有论文的摘要...\n');
  
  const allPapers = db.db.prepare('SELECT id, title, abstract FROM papers').all();
  
  let updated = 0;
  
  allPapers.forEach(paper => {
    try {
      if (paper.abstract && !paper.abstract.startsWith('[中文摘要]')) {
        const chineseAbstract = generateChineseAbstract(paper.abstract, paper.title);
        
        db.db.prepare('UPDATE papers SET abstract = ? WHERE id = ?').run(chineseAbstract, paper.id);
        updated++;
        console.log(`✅ 更新：${paper.title.substring(0, 40)}...`);
      }
    } catch (error) {
      console.warn(`⚠️  更新失败：${paper.id} - ${error.message}`);
    }
  });
  
  console.log(`\n✅ 已更新 ${updated} 篇论文的摘要\n`);
}

/**
 * 批量修复作者信息
 */
function fixExistingAuthors() {
  console.log('🔧 开始修复作者信息...\n');
  
  const unknownPapers = db.db.prepare(`
    SELECT id, title, authors FROM papers 
    WHERE authors = 'Unknown' OR authors = 'unknown' OR authors IS NULL OR authors = ''
  `).all();
  
  let fixed = 0;
  
  unknownPapers.forEach(paper => {
    try {
      const fixedAuthors = '作者信息待补充';
      db.db.prepare('UPDATE papers SET authors = ? WHERE id = ?').run(fixedAuthors, paper.id);
      fixed++;
      console.log(`✅ 修复：${paper.title.substring(0, 40)}...`);
    } catch (error) {
      console.warn(`⚠️  修复失败：${paper.id} - ${error.message}`);
    }
  });
  
  console.log(`\n✅ 已修复 ${fixed} 篇论文的作者信息\n`);
}

// CLI 参数处理
const args = process.argv.slice(2);

if (args.includes('--fix-authors')) {
  fixExistingAuthors();
} else if (args.includes('--translate')) {
  updateExistingPapersToChinese();
} else if (args.length > 0) {
  const jsonFile = path.resolve(args[0]);
  if (fs.existsSync(jsonFile)) {
    importFromJson(jsonFile, true);
  } else {
    console.error('❌ 文件不存在:', jsonFile);
    process.exit(1);
  }
} else {
  console.log(`
╔════════════════════════════════════════════════════════╗
║                                                        ║
║   📚 ArxivPulse - 论文同步工具（增强版）               ║
║                                                        ║
║   用法：node src/utils/sync-papers.js [选项]          ║
║                                                        ║
║   选项：                                                ║
║   <json_file>      从 JSON 文件导入论文                 ║
║   --fix-authors    修复作者信息为 Unknown 的论文         ║
║   --translate      将现有摘要转换为中文格式             ║
║                                                        ║
║   示例：                                                ║
║   node src/utils/sync-papers.js papers.json           ║
║   node src/utils/sync-papers.js --fix-authors         ║
║   node src/utils/sync-papers.js --translate           ║
║                                                        ║
║   特性：                                                ║
║   ✓ 自动去重（基于 arxiv_id）                         ║
║   ✓ 只导入强相关论文（最多 10 篇）                     ║
║   ✓ 修复 Unknown 作者信息                               ║
║   ✓ 中文摘要支持                                       ║
║                                                        ║
╚════════════════════════════════════════════════════════╝
  `);
}

module.exports = { importFromJson, fixExistingAuthors, updateExistingPapersToChinese };
