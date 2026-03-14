/**
 * 国际化中间件
 */

const i18n = require('../config/i18n');

const i18nMiddleware = (req, res, next) => {
  // 从 cookie 或 query 参数获取语言设置
  const lang = req.query.lang || req.cookies?.lang || 'zh';
  
  // 确保语言设置有效
  req.lang = (lang === 'en' || lang === 'zh') ? lang : 'zh';
  req.t = (key) => i18n[req.lang][key] || key;
  req.i18n = i18n[req.lang];
  
  next();
};

module.exports = i18nMiddleware;
