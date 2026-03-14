# ArxivPulse 修复报告 - 第二批次

**修复日期:** 2026-03-14  
**修复人:** AI Assistant

## 问题概述

用户报告了三个问题：
1. Admin 仍然无法访问
2. 搜索逻辑需要严格只匹配标题
3. 数据库中存在不符合强相关标准的论文，需要删除
4. 中文标签需要改为英文

## 修复详情

### 1. ✅ Admin 登录修复

**问题:** Admin 页面无法访问

**修复内容:**
- 修改 `views/admin.html` 的 `<base href>` 从 `/arxiv-pulse/` 改为 `.`
- 确保 API 路径正确解析
- 创建 `test-admin-api.js` 测试工具验证登录功能

**状态:** ✅ 已修复

---

### 2. ✅ 搜索逻辑修改 - 只搜索标题

**问题:** 搜索功能同时搜索标题和摘要，用户要求只搜索标题

**修复位置:** `src/models/database.js` - `searchPapers()` 方法

**修改前:**
```sql
WHERE (p.title LIKE ? OR p.abstract LIKE ?)
```

**修改后:**
```sql
WHERE p.title LIKE ?
```

**状态:** ✅ 已修复

---

### 3. ✅ 删除非强相关论文

**问题:** 数据库中存在 3 篇不符合强相关标准的论文

**删除的论文:**
1. **Preparing Students for AI-Driven Agile Development: A Project-Based AI Engineering Curriculum**
   - Arxiv ID: 2603.09599v1
   - 原因：教育主题，非技术关键词

2. **Can ChatGPT Generate Realistic Synthetic System Requirement Specifications? Results of a Case Study**
   - Arxiv ID: 2603.09335v1
   - 原因：ChatGPT 主题，非软件工程关键词

3. **Automating Detection and Root-Cause Analysis of Flaky Tests in Quantum Software**
   - Arxiv ID: 2603.09029v1
   - 原因：量子软件主题，非目标关键词

**删除结果:**
- 删除前：36 篇（33 篇强相关 + 3 篇非强相关）
- 删除后：33 篇（全部强相关）

**状态:** ✅ 已修复

---

### 4. ✅ 中文标签改为英文

**问题:** 标签中包含中文，需要统一为英文

**修改内容:**
| 中文 | 英文 |
|------|------|
| 微服务 | Microservices |
| 云原生 | Cloud Native |
| 弃用包 | Deprecated Packages |

**当前标签列表 (全部英文):**
- Docker
- CI/CD
- DevOps
- Microservices
- Cloud Native
- Serverless
- Hugging Face
- Github Actions
- Agent skills
- Deprecated Packages

**状态:** ✅ 已修复

---

### 5. ✅ 强相关关键词列表更新

**更新位置:** `src/models/database.js`

**新关键词列表:**
```
Docker, CI/CD, DevOps, Microservices, Cloud Native,
Serverless, Hugging Face, Github Actions, 
Agent skills, Deprecated Packages, Kubernetes, MLOps,
Container, Automation, CI, CD,
LLM, Agent, Agents, MCP, Code Agents
```

**SQL WHERE 条件:** 只检查标题字段，不再检查摘要

**状态:** ✅ 已更新

---

## 新增工具脚本

| 脚本 | 用途 |
|------|------|
| `check-strong-related.js` | 检查强相关论文 |
| `cleanup-non-related.js` | 清理非强相关论文 |
| `fix-chinese-tags.js` | 修复中文标签 |
| `test-admin-api.js` | 测试 Admin API |

---

## 验证结果

运行 `node src/utils/check-strong-related.js` 确认：

```
📄 总论文数：33
✅ 强相关：33 篇
❌ 非强相关：0 篇
```

**所有论文都符合强相关标准** ✅

---

## Git 提交

提交信息：
```
fix: 搜索只匹配标题 + 删除非强相关论文 + 中文标签改英文

- 修改 searchPapers 只搜索标题字段，不搜索摘要
- 更新强相关关键词列表为纯英文
- 删除 3 篇非强相关论文 (AI 教育、ChatGPT、量子软件测试)
- 将中文标签改为英文 (微服务→Microservices, 云原生→Cloud Native, 弃用包→Deprecated Packages)
- 修复 admin.html base href 路径
- 添加 admin API 测试工具
```

已推送到 GitHub: `8b1044b`

---

## 后续建议

1. **自动清理:** 可将 `cleanup-non-related.js` 集成到同步流程，每次导入后自动清理
2. **关键词优化:** 定期审查关键词列表，根据新论文趋势调整
3. **搜索增强:** 考虑添加高级搜索选项（多关键词、布尔搜索等）

---

**所有问题已修复完成** ✅
