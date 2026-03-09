/**
 * 数据库初始化脚本
 */

const path = require('path');
const fs = require('fs');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

// 确保数据目录存在
const dataDir = path.join(__dirname, '../../data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
  console.log('✅ 创建数据目录:', dataDir);
}

// 导入数据库模型（会自动初始化）
require('../models/database');

console.log('✅ 数据库初始化完成');
console.log('📁 数据库位置:', process.env.DATABASE_PATH || path.join(__dirname, '../../data/arxiv-pulse.db'));
