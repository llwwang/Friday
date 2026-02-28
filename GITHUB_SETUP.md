# GitHub 推送指南

本地Git仓库已创建，现在需要推送到GitHub。

## 📋 步骤

### 1. 在GitHub上创建仓库

1. 访问 https://github.com/new
2. 填写仓库信息：
   - **Repository name**: `leozwang-projects` (或你喜欢的名字)
   - **Description**: 个人项目资源归档 - AI能力建设、网站开发、TBDS自动化
   - **Visibility**: Private (建议私有，包含内部项目信息)
   - **不要**勾选 "Initialize this repository with a README"
3. 点击 **Create repository**

### 2. 连接本地仓库

```bash
cd /root/.openclaw/workspace/github-projects/leozwang-projects

# 添加远程仓库（用你的用户名替换 YOUR_USERNAME）
git remote add origin https://github.com/YOUR_USERNAME/leozwang-projects.git

# 验证远程仓库
git remote -v
```

### 3. 推送到GitHub

```bash
# 推送到main分支
git push -u origin main
```

如果提示输入用户名密码，使用GitHub Personal Access Token：
- 访问 https://github.com/settings/tokens
- 生成新的token（选择 repo 权限）
- 用token作为密码

### 4. 验证

访问 `https://github.com/YOUR_USERNAME/leozwang-projects` 查看上传的文件。

## 📊 仓库内容

- **110个文件**，**43MB**
- 包含：
  - TBDS自动化脚本和截图 (89个)
  - 网站开发截图 (9个)
  - AI项目PPT和配置 (4个)
  - Friday形象资产 (2个)
  - 文档处理脚本 (4个)

## 🔄 后续更新

添加新文件后：

```bash
cd /root/.openclaw/workspace/github-projects/leozwang-projects

git add .
git commit -m "描述你的更改"
git push origin main
```

## ⚠️ 注意事项

- 本仓库包含项目截图，建议设为 **Private**
- 不包含敏感信息（密码、密钥等）
- 定期推送备份

---

*Created by Friday on 2026-02-28*
