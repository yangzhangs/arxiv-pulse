# 🔐 ArxivPulse 管理员登录指南

## 📍 登录地址

**管理后台 URL**: `http://www.reset-group.site/arxiv-pulse/admin`

或

**管理后台 URL**: `http://localhost:3000/admin` (本地开发)

---

## 🎯 登录方式

### 1. 直接访问管理后台

在浏览器中输入上述 URL 即可看到登录页面。

### 2. 默认管理员账号

```
用户名：admin
密码：admin123
```

**⚠️ 重要**: 首次登录后请立即修改密码！

---

## 📋 修改密码方法

### 方法一：编辑 .env 文件

```bash
cd /root/.openclaw/workspace/projects/arxiv-pulse
nano .env
```

修改以下配置：

```bash
ADMIN_USERNAME=admin
ADMIN_PASSWORD=你的新密码
```

然后重启服务：

```bash
pm2 restart arxiv-pulse
```

### 方法二：删除管理员账号重新创建

```bash
# 备份数据库
cp data/arxiv-pulse.db data/arxiv-pulse.db.backup

# 删除管理员表
sqlite3 data/arxiv-pulse.db "DROP TABLE admins;"

# 重新运行迁移（使用新密码）
export ADMIN_PASSWORD=你的新密码
npm run migrate
```

---

## 🎛️ 管理后台功能

登录后可以看到：

### 1. 数据统计卡片
- 总论文数
- 标签数量
- 待审核申请数
- 近 7 天新增论文

### 2. 标签申请审核
- 查看所有标签申请
- 按状态筛选（全部/待审核/已通过/已拒绝）
- 审核操作（通过/拒绝）
- 查看申请人 IP 和审核时间

### 3. 其他管理功能
- 批量导入论文
- 清理旧数据
- 查看统计信息

---

## 🔒 安全建议

### 必须执行
1. **修改默认密码** - 首次部署后立即修改
2. **不要提交 .env 到 Git** - 包含敏感信息
3. **启用 HTTPS** - 使用 Let's Encrypt 免费证书

### 推荐执行
4. **定期审查申请记录** - 防止恶意申请
5. **限制访问** - 考虑 IP 白名单或 Basic Auth
6. **定期备份数据库** - 防止数据丢失

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

### Q: 管理后台页面空白？

A: 检查以下几点：
1. 确保服务已启动：`pm2 status arxiv-pulse`
2. 查看日志：`pm2 logs arxiv-pulse`
3. 清除浏览器缓存
4. 检查浏览器控制台错误

### Q: 登录后会话立即过期？

A: 会话有效期为 24 小时。如果立即过期，可能是：
1. 浏览器禁用了 localStorage
2. 清除浏览器缓存时删除了会话
3. 服务器重启导致会话丢失

重新登录即可。

---

## 📞 技术支持

- **GitHub Issues**: https://github.com/yangzhangs/arxiv-pulse/issues
- **项目文档**: README.md
- **快速指南**: QUICKSTART.md

---

**最后更新**: 2026-03-10  
**版本**: v1.1.0
