# 🚀 ArxivPulse 快速使用指南

## 本次更新内容

✅ **标签审核系统** - 用户可申请标签，管理员审核后生效  
✅ **管理后台** - 支持数据统计、标签审核  
✅ **界面优化** - 简介扩展至中文 150 字，添加 RESET group 标注  

---

## 📋 部署步骤

### 1. 拉取最新代码

```bash
cd /root/.openclaw/workspace/projects/arxiv-pulse
git pull origin main
```

### 2. 安装依赖

```bash
npm install
```

### 3. 配置环境变量

```bash
cp .env.example .env
nano .env  # 或使用其他编辑器
```

**重要**: 修改默认管理员密码！

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=你的安全密码
```

### 4. 数据库迁移

```bash
npm run migrate
```

看到以下输出表示成功：

```
✅ 数据库迁移完成！
📊 当前数据库状态:
   - 标签总数：10
   - 管理员数量：1
🎉 迁移成功！
```

### 5. 重启服务

```bash
# 如果使用 PM2
pm2 restart arxiv-pulse

# 或者直接启动
npm start
```

---

## 🎯 功能使用说明

### 普通用户 - 申请标签

1. 访问标签页面：`https://www.reset-group.site/arxiv-pulse/tags`
2. 在"申请添加你感兴趣的标签"输入框中输入标签名称
3. 点击"提交申请"按钮
4. 等待管理员审核
5. 在"我的申请记录"中查看审核状态

**状态说明**:
- 🟡 **审核中** - 已提交，等待管理员审核
- 🟢 **已通过** - 审核通过，标签已添加到列表
- 🔴 **已拒绝** - 审核未通过

### 管理员 - 审核标签

1. 访问管理后台：`https://www.reset-group.site/arxiv-pulse/admin`
2. 使用管理员账号登录
   - 默认用户名：`admin`
   - 默认密码：你在 `.env` 中设置的密码
3. 查看统计数据概览
4. 在"标签申请审核"区域查看待审核申请
5. 点击"✓ 通过"或"✗ 拒绝"按钮

**筛选功能**:
- **全部** - 显示所有申请记录
- **待审核** - 只显示需要审核的申请（默认）
- **已通过** - 查看历史通过的申请
- **已拒绝** - 查看历史拒绝的申请

---

## 🔐 安全建议

### ⚠️ 必须执行

1. **修改默认密码**
   ```bash
   # 编辑 .env 文件
   ADMIN_PASSWORD=你的强密码
   ```

2. **不要提交 .env 到 Git**
   ```bash
   # .env 已在 .gitignore 中，确保不要手动添加
   ```

3. **启用 HTTPS**
   - 使用 Let's Encrypt 免费证书
   - Nginx 配置 SSL

### 推荐执行

4. **定期备份数据库**
   ```bash
   # 添加到 crontab
   0 2 * * * cp /root/.openclaw/workspace/projects/arxiv-pulse/data/arxiv-pulse.db /backup/arxiv-pulse.db.$(date +\%Y\%m\%d)
   ```

5. **监控申请记录**
   - 定期登录管理后台查看申请
   - 防止恶意申请

6. **限制访问**
   - 如果只供内部使用，考虑 IP 白名单
   - 或使用 Basic Auth

---

## 📊 验证部署

### 检查清单

- [ ] 网站首页正常访问
- [ ] 标签页面可以提交申请
- [ ] 管理后台可以登录
- [ ] 数据库迁移成功
- [ ] 日志无报错

### 测试流程

1. **测试标签申请**
   ```bash
   curl -X POST http://localhost:3000/api/tags/apply \
     -H "Content-Type: application/json" \
     -d '{"name":"TestTag"}'
   ```
   应返回：`{"success":true,"message":"标签申请已提交..."}`

2. **测试管理员登录**
   ```bash
   curl -X POST http://localhost:3000/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"你的密码"}'
   ```
   应返回：`{"success":true,"sessionId":"..."}`

3. **查看申请列表**（需要 sessionId）
   ```bash
   curl http://localhost:3000/api/admin/applications \
     -H "x-session-id: YOUR_SESSION_ID"
   ```

---

## 🆘 常见问题

### Q: 忘记管理员密码怎么办？

A: 可以直接删除数据库中的管理员记录，然后重新运行迁移：

```bash
# 备份数据库
cp data/arxiv-pulse.db data/arxiv-pulse.db.backup

# 删除管理员表
sqlite3 data/arxiv-pulse.db "DROP TABLE admins;"

# 重新运行迁移
npm run migrate
```

会使用默认密码 `admin123` 重新创建管理员账号。

### Q: 申请提交后看不到？

A: 申请记录保存在浏览器的 localStorage 中：
- 清除浏览器缓存会导致记录丢失
- 更换设备或浏览器也看不到之前的记录
- 但申请数据在数据库中，管理员仍可在后台看到

### Q: 如何批量导入论文？

A: 使用 HEARTBEAT.md 中配置的同步脚本：

```bash
node /root/.openclaw/workspace/projects/arxiv-pulse/src/utils/sync-papers.js papers.json
```

数据格式参考 `src/utils/sync-papers.js`。

### Q: 数据库迁移失败怎么办？

A: 检查以下几点：
1. 确保已安装依赖：`npm install`
2. 确保数据库文件存在且可写
3. 查看详细错误信息
4. 如果是全新安装，直接运行 `npm run init-db`

---

## 📞 技术支持

- **GitHub Issues**: https://github.com/yangzhangs/arxiv-pulse/issues
- **项目文档**: README.md
- **更新日志**: CHANGELOG-2026-03-10.md

---

**最后更新**: 2026-03-10  
**版本**: v1.1.0
