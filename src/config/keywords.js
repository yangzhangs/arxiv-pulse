/**
 * 强相关关键词配置
 * 统一中英文命名，集中管理
 */

module.exports = {
  // 英文关键词（严格连续匹配）
  en: [
    'Agent skills', 'Docker', 'CI/CD', 'DevOps', 'Microservices',
    'Serverless', 'Hugging Face', 'Github Actions', 'GitHub Actions',
    'MLOps', 'Deprecated Packages'
  ],
  
  // 标签映射（关键词 → 标签名，严格连续匹配）
  tagMap: {
    'Agent skills': 'Agent skills',
    'Docker': 'Docker',
    'CI/CD': 'CI/CD',
    'DevOps': 'DevOps',
    'Microservices': 'Microservices',
    'Serverless': 'Serverless',
    'Hugging Face': 'Hugging Face',
    'Github Actions': 'Github Actions',
    'GitHub Actions': 'Github Actions',
    'MLOps': 'MLOps',
    'Deprecated Packages': 'Deprecated Packages'
  }
};
