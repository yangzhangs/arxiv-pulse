#!/bin/bash
# ArxivPulse 部署脚本

set -e

echo "🚀 开始部署 ArxivPulse..."

# 进入项目目录
cd /root/.openclaw/workspace/projects/arxiv-pulse

# 安装依赖
echo "📦 安装依赖..."
npm install --production

# 初始化数据库
echo "🗄️ 初始化数据库..."
npm run init-db

# 重启 PM2 应用
echo "🔄 重启应用..."
pm2 restart arxiv-pulse || pm2 start src/app.js --name arxiv-pulse

# 保存 PM2 配置
echo "💾 保存 PM2 配置..."
pm2 save

echo "✅ 部署完成！"
echo ""
echo "📊 查看应用状态：pm2 status arxiv-pulse"
echo "📝 查看应用日志：pm2 logs arxiv-pulse"
echo "🌐 访问地址：https://www.reset-group.site/arxiv-papers"
