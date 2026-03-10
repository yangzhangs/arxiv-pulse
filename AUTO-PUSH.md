# 🚀 自动推送配置

## 概述

本项目已配置自动推送功能，每次 commit 后会自动推送到 GitHub 远程仓库。

---

## 配置方式

### 方法一：Git Hook（已配置）

项目已配置 `.git/hooks/post-commit` 钩子，每次 commit 后自动执行推送。

**钩子脚本内容**:
```bash
#!/bin/bash
# Git post-commit hook - 自动推送到远程仓库

echo "🚀 自动推送到 GitHub..."

# 获取当前分支
BRANCH=$(git rev-parse --abbrev-ref HEAD)

# 执行推送
git push origin $BRANCH 2>&1

if [ $? -eq 0 ]; then
    echo "✅ 推送成功！"
else
    echo "❌ 推送失败，请检查网络连接或认证信息"
    echo "提示：可能需要配置 GitHub Token"
fi
```

**启用方法**:
```bash
chmod +x .git/hooks/post-commit
```

---

## 认证配置

### HTTPS 推送（推荐）

使用 GitHub Personal Access Token (PAT) 进行认证：

### 1. 创建 Token

1. 访问 https://github.com/settings/tokens
2. 点击 "Generate new token (classic)"
3. 选择 scopes: `repo` (完整仓库权限)
4. 生成并复制 token

### 2. 配置 Git 使用 Token

```bash
# 方法一：全局配置（推荐）
git config --global credential.helper store

# 首次推送时会提示输入用户名和密码（token）
# 之后会自动记住

# 方法二：每次手动指定
GIT_ASKPASS=echo git push origin main
```

### 3. 使用 SSH 推送（可选）

```bash
# 生成 SSH key
ssh-keygen -t ed25519 -C "your_email@example.com"

# 添加到 GitHub
# https://github.com/settings/keys

# 修改远程仓库 URL
git remote set-url origin git@github.com:yangzhangs/arxiv-pulse.git
```

---

## 测试推送

```bash
cd /root/.openclaw/workspace/projects/arxiv-pulse

# 手动测试推送
git push origin main

# 或者创建一个测试 commit
echo "test" >> test.txt
git add test.txt
git commit -m "test: 自动推送测试"
# 钩子会自动执行推送
```

---

## 故障排查

### 问题 1: 推送失败，认证错误

**解决方案**:
```bash
# 清除缓存的凭证
git credential-cache exit
# 或
rm -rf ~/.git-credentials

# 重新推送，会提示输入
git push origin main
```

### 问题 2: Hook 未执行

**检查**:
```bash
# 确认钩子文件存在
ls -la .git/hooks/post-commit

# 确认可执行权限
chmod +x .git/hooks/post-commit
```

### 问题 3: 网络超时

**解决方案**:
```bash
# 增加 Git 超时时间
git config --global http.postBuffer 524288000

# 使用 SSH 代替 HTTPS
git remote set-url origin git@github.com:yangzhangs/arxiv-pulse.git
```

---

## 最佳实践

### 1. 小步提交

每次修改后及时 commit，避免大量累积：

```bash
git add -A
git commit -m "feat: 简短描述"
# 自动推送
```

### 2. 有意义的 commit 消息

遵循 Conventional Commits 规范：

- `feat:` 新功能
- `fix:` 修复 bug
- `docs:` 文档更新
- `style:` 代码格式
- `refactor:` 重构
- `test:` 测试
- `chore:` 构建/工具

### 3. 定期检查推送状态

```bash
# 查看远程仓库状态
git remote show origin

# 查看本地和远程差异
git status

# 查看最近 commit
git log --oneline -5
```

---

## 自动化工作流

### 完整流程

```bash
# 1. 修改文件
# ... 编辑代码 ...

# 2. 添加更改
git add -A

# 3. 提交（自动推送）
git commit -m "feat: 功能描述"

# 4. 验证推送
git status  # 应该显示 "Your branch is up to date"
```

### 批量修改

```bash
# 多个文件修改
git add -A
git commit -m "refactor: 重构多个模块"
# 自动推送到 GitHub
```

---

## 注意事项

1. **Token 安全**: 不要将 token 提交到仓库
2. **网络稳定**: 确保网络连接稳定
3. **分支同步**: 推送前确保在正确的分支
4. **冲突处理**: 如有冲突，先 pull 再 push

---

## 相关文档

- [GitHub Token 指南](https://docs.github.com/en/authentication/keeping-your-account-and-data-secure/creating-a-personal-access-token)
- [Git Hooks 文档](https://git-scm.com/docs/githooks)
- [Conventional Commits](https://www.conventionalcommits.org/)

---

**配置时间**: 2026-03-10  
**配置版本**: v1.0  
**维护者**: yangzhangs
