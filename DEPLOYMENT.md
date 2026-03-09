# 🚀 ArxivPulse 部署文档

## 快速部署

### 一键部署（推荐）

```bash
cd /root/.openclaw/workspace/projects/arxiv-pulse
./deploy.sh
```

### 手动部署

1. **安装依赖**
```bash
npm install --production
```

2. **初始化数据库**
```bash
npm run init-db
```

3. **启动应用**
```bash
pm2 start src/app.js --name arxiv-pulse
pm2 save
```

4. **配置 Nginx**（已完成）
```bash
# 配置文件位于：/etc/nginx/sites-available/arxiv-pulse
# 已启用：/etc/nginx/sites-enabled/arxiv-pulse
```

5. **重新加载 Nginx**
```bash
sudo nginx -s reload
```

---

## 当前部署状态

| 项目 | 状态 |
|------|------|
| **GitHub 仓库** | ✅ https://github.com/yangzhangs/arxiv-pulse |
| **PM2 进程** | ✅ arxiv-pulse (online) |
| **Nginx 配置** | ✅ /etc/nginx/sites-available/arxiv-pulse |
| **数据库** | ✅ /root/.openclaw/workspace/projects/arxiv-pulse/data/arxiv-pulse.db |
| **访问地址** | ✅ https://www.reset-group.site/arxiv-papers |

---

## 常用命令

### 查看应用状态
```bash
pm2 status arxiv-pulse
```

### 查看应用日志
```bash
pm2 logs arxiv-pulse
```

### 重启应用
```bash
pm2 restart arxiv-pulse
```

### 停止应用
```bash
pm2 stop arxiv-pulse
```

### 删除应用
```bash
pm2 delete arxiv-pulse
```

---

## 数据同步

### 从 JSON 文件导入论文

```bash
cd /root/.openclaw/workspace/projects/arxiv-pulse
node src/utils/sync-papers.js /path/to/papers.json
```

### JSON 数据格式

```json
{
  "papers": [
    {
      "arxiv_id": "2403.12345",
      "title": "论文标题",
      "authors": "作者 1, 作者 2, 作者 3",
      "abstract": "摘要内容...",
      "pdf_url": "https://arxiv.org/pdf/2403.12345.pdf",
      "arxiv_url": "https://arxiv.org/abs/2403.12345",
      "published_date": "2024-03-08",
      "tags": ["Docker", "CI/CD", "DevOps"]
    }
  ]
}
```

---

## 与 HEARTBEAT 任务集成

Arxiv 学术文章检索任务（HEARTBEAT.md）会自动将检索到的论文同步到网站数据库。

**同步脚本路径：**
```bash
node /root/.openclaw/workspace/projects/arxiv-pulse/src/utils/sync-papers.js papers.json
```

**触发时间：** 每周二至周六 08:00-09:00（北京时间）

**发送渠道：** 飞书 → 张洋

---

## 安全配置

### 环境变量

生产环境应设置以下环境变量（复制 `.env.example` 为 `.env`）：

```bash
PORT=3000
NODE_ENV=production
DATABASE_PATH=./data/arxiv-pulse.db
BASE_URL=https://www.reset-group.site/arxiv-papers
ADMIN_TOKEN=your_secure_admin_token_here
```

### 安全建议

1. ✅ **不要提交 `.env` 文件到 Git**（已在 .gitignore 中）
2. ✅ **数据库文件不提交**（已在 .gitignore 中）
3. ✅ **使用 Nginx 反向代理和 HTTPS**
4. ⚠️ **设置 ADMIN_TOKEN 保护管理 API**
5. ✅ **定期备份数据库**

### 数据库备份

```bash
# 备份数据库
cp data/arxiv-pulse.db data/arxiv-pulse.db.backup.$(date +%Y%m%d)

# 定期清理旧备份（保留 30 天）
find data/ -name "*.backup.*" -mtime +30 -delete
```

---

## 故障排查

### 应用无法访问

1. **检查 PM2 状态**
```bash
pm2 status arxiv-pulse
```

2. **查看应用日志**
```bash
pm2 logs arxiv-pulse --lines 50
```

3. **检查端口占用**
```bash
netstat -tlnp | grep 3000
```

4. **测试本地访问**
```bash
curl http://127.0.0.1:3000/api/papers
```

### Nginx 问题

1. **测试配置**
```bash
sudo nginx -t
```

2. **重新加载**
```bash
sudo nginx -s reload
```

3. **查看 Nginx 日志**
```bash
tail -f /var/log/nginx/error.log
```

---

## 更新部署

```bash
cd /root/.openclaw/workspace/projects/arxiv-pulse
git pull origin main
npm install --production
pm2 restart arxiv-pulse
```

---

## 联系支持

- **GitHub Issues:** https://github.com/yangzhangs/arxiv-pulse/issues
- **项目地址:** https://github.com/yangzhangs/arxiv-pulse
