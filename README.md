# 📚 ArxivPulse

Arxiv 学术文章展示平台 - 每日自动同步最新 Software Engineering 领域论文

![License](https://img.shields.io/badge/license-MIT-blue.svg)
![Node.js](https://img.shields.io/badge/node-%3E%3D18.0.0-green.svg)

## 🎯 项目简介

ArxivPulse 是一个自动化的学术文章展示平台，专注于追踪和展示 Software Engineering 领域的最新研究成果。系统每日自动检索 arXiv 上的最新论文，通过智能标签系统分类，并提供简洁美观的界面供用户浏览和搜索。

**在线访问:** [www.reset-group.site/arxiv-papers](https://www.reset-group.site/arxiv-papers)

## ✨ 功能特性

- 🔄 **自动检索** - 每周二至周六自动检索最新论文
- 🏷️ **标签筛选** - 支持多标签分类和筛选
- 🔍 **全文搜索** - 支持标题、作者、摘要搜索
- 📱 **响应式设计** - 支持桌面和移动端
- 📬 **消息推送** - 飞书定时推送整理后的文章
- ➕ **标签扩展** - 支持动态添加新标签

## 🔧 技术栈

- **后端:** Node.js + Express
- **数据库:** SQLite
- **前端:** HTML5 + TailwindCSS + Alpine.js
- **部署:** PM2 + Nginx

## 🚀 快速开始

### 环境要求

- Node.js >= 18.0.0
- npm 或 yarn
- PM2 (生产环境)
- Nginx (生产环境)

### 安装步骤

1. **克隆仓库**
```bash
git clone https://github.com/yangzhangs/arxiv-pulse.git
cd arxiv-pulse
```

2. **安装依赖**
```bash
npm install
```

3. **配置环境变量**
```bash
cp .env.example .env
# 编辑 .env 文件，根据需要修改配置
```

4. **初始化数据库**
```bash
npm run init-db
```

5. **启动服务**
```bash
# 开发环境
npm run dev

# 生产环境
npm start
```

## 📁 项目结构

```
arxiv-pulse/
├── src/
│   ├── app.js              # 主应用入口
│   ├── routes/
│   │   ├── papers.js       # 论文 API
│   │   ├── tags.js         # 标签 API
│   │   └── admin.js        # 管理后台 API
│   ├── models/
│   │   └── database.js     # 数据库模型
│   └── utils/
│       ├── init-db.js      # 数据库初始化
│       └── sync-papers.js  # 论文同步工具
├── public/
│   ├── css/
│   │   └── style.css       # 自定义样式
│   └── js/
│       └── app.js          # 前端应用逻辑
├── views/
│   ├── index.html          # 首页
│   ├── tags.html           # 标签管理页
│   ├── about.html          # 关于页
│   └── 404.html            # 404 页面
├── data/                   # 数据库文件（git 忽略）
├── config/                 # 配置文件
├── .env.example            # 环境变量示例
├── .gitignore              # Git 忽略文件
├── package.json            # 项目配置
└── README.md               # 项目文档
```

## 🔌 API 接口

### 论文 API

- `GET /api/papers` - 获取所有论文
- `GET /api/papers/:id` - 获取单篇论文
- `GET /api/papers/tag/:tagName` - 按标签筛选
- `GET /api/papers/search/:query` - 搜索论文
- `POST /api/papers` - 添加论文（需要认证）

### 标签 API

- `GET /api/tags` - 获取所有标签
- `POST /api/tags` - 添加标签（需要认证）
- `DELETE /api/tags/:id` - 删除标签（需要认证）

### 管理 API

- `GET /api/admin/stats` - 获取统计数据
- `POST /api/admin/import` - 批量导入论文
- `DELETE /api/admin/cleanup` - 清理旧数据

## 🔐 安全配置

### 环境变量

```bash
# .env 文件配置
PORT=3000
NODE_ENV=production
DATABASE_PATH=./data/arxiv-pulse.db
BASE_URL=https://www.reset-group.site/arxiv-papers
ADMIN_TOKEN=your_secure_admin_token_here
```

### 安全建议

1. **不要提交 `.env` 文件到 Git**
2. **生产环境设置 `ADMIN_TOKEN`**
3. **使用 Nginx 反向代理和 HTTPS**
4. **定期备份数据库**

## 📅 定时任务集成

### 与现有 Arxiv 检索任务集成

修改 HEARTBEAT.md 中的 Arxiv 检索任务，添加数据同步步骤：

```javascript
// 在检索到论文后，调用同步脚本
node /root/.openclaw/workspace/projects/arxiv-pulse/src/utils/sync-papers.js papers.json
```

### 飞书推送

系统会自动将最新论文推送到飞书，同时同步到网站数据库。

## 🌐 Nginx 配置示例

```nginx
server {
    listen 80;
    server_name www.reset-group.site;

    location /arxiv-papers {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## 📊 监控和维护

### 使用 PM2 管理进程

```bash
# 安装 PM2
npm install -g pm2

# 启动应用
pm2 start src/app.js --name arxiv-pulse

# 设置开机自启
pm2 startup
pm2 save

# 查看日志
pm2 logs arxiv-pulse

# 重启应用
pm2 restart arxiv-pulse
```

### 数据库备份

```bash
# 备份数据库
cp data/arxiv-pulse.db data/arxiv-pulse.db.backup.$(date +%Y%m%d)

# 定期清理旧备份（保留 30 天）
find data/ -name "*.backup.*" -mtime +30 -delete
```

## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

## 📄 许可证

MIT License - 详见 [LICENSE](LICENSE) 文件

## 📬 联系方式

- **GitHub:** [@yangzhangs](https://github.com/yangzhangs)
- **项目地址:** [github.com/yangzhangs/arxiv-pulse](https://github.com/yangzhangs/arxiv-pulse)

---

**Made with ❤️ for academic research**
