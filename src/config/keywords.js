/**
 * 强相关关键词配置
 * 统一中英文命名，集中管理
 */

module.exports = {
  // 英文关键词（连续匹配）
  en: [
    'Docker', 'CI/CD', 'DevOps', 'Microservices', 'Cloud Native',
    'Serverless', 'Hugging Face', 'Github Actions',
    'Agent skills', 'Deprecated Packages', 'Kubernetes', 'MLOps',
    'Container', 'Automation', 'LLM', 'Agent', 'Agents', 'MCP', 'Code Agents'
  ],
  
  // 中文关键词
  zh: [
    '容器', '自动化', '微服务', '云原生',
    '持续集成', '持续部署', '智能代理', '代码代理'
  ],
  
  // 标签映射（关键词 → 标签名）
  tagMap: {
    'Docker': 'Docker',
    '容器': 'Docker',
    'CI/CD': 'CI/CD',
    '持续集成': 'CI/CD',
    '持续部署': 'CI/CD',
    'DevOps': 'DevOps',
    'Microservices': 'Microservices',
    '微服务': 'Microservices',
    'Cloud Native': 'Cloud Native',
    '云原生': 'Cloud Native',
    'Serverless': 'Serverless',
    'Hugging Face': 'Hugging Face',
    'Github Actions': 'Github Actions',
    'Agent skills': 'Agent skills',
    '智能代理': 'Agent skills',
    'Agent': 'Agent skills',
    'Agents': 'Agent skills',
    '代码代理': 'Agent skills',
    'Code Agents': 'Agent skills',
    'Deprecated Packages': 'Deprecated Packages',
    'Kubernetes': 'Cloud Native',
    'MLOps': 'MLOps',
    'Container': 'Docker',
    'Automation': '自动化',
    '自动化': '自动化',
    'LLM': 'Agent skills',
    'MCP': 'Agent skills'
  }
};
