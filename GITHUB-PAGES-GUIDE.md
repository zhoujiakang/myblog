# Hexo 博客写作与 GitHub Pages 发布攻略

这份文档适用于当前博客。项目已经配置 GitHub Actions，每次把 `main` 分支推送到 GitHub 后，网站会自动构建并发布。

当前地址：

- GitHub 仓库：<https://github.com/zhoujiakang/myblog>
- 在线博客：<https://zhoujiakang.github.io/myblog/>
- 默认分支：`main`

## 一、在本地运行博客

进入博客目录：

```bash
cd /Users/zzz/code/myblog/blog
```

第一次使用或依赖发生变化时安装依赖：

```bash
pnpm install
```

启动本地预览：

```bash
pnpm exec hexo clean
pnpm exec hexo server -p 4001
```

浏览器打开 <http://localhost:4001>。

## 二、添加一篇文章

创建文章：

```bash
pnpm exec hexo new post "文章标题"
```

新文件位于 `source/_posts/文章标题.md`。推荐使用下面的格式：

```markdown
---
title: 文章标题
date: 2026-09-22 18:00:00
categories:
  - 技术
tags:
  - Hexo
  - 学习记录
description: 这里填写文章摘要
cover: /img/home-hero.jpg
---

这里开始写正文。

## 小标题

正文支持标准 Markdown。
```

图片放到 `source/img/`，文章中这样引用：

```markdown
![图片说明](/img/图片名称.jpg)
```

写完后执行：

```bash
pnpm exec hexo clean
pnpm exec hexo generate
```

## 三、第一次上传到 GitHub（已完成）

当前项目已经登录 GitHub、创建公开仓库并完成首次部署。下面保留首次配置步骤，供以后迁移电脑或重新创建仓库时参考。

### 1. 登录 GitHub CLI

当前电脑已经安装 `gh`。如果换电脑后尚未登录，执行：

```bash
gh auth login
```

依次选择：

1. `GitHub.com`
2. `HTTPS`
3. `Login with a web browser`

根据终端提示，在浏览器中完成登录。

### 2. 创建远程仓库并上传

登录成功后，进入博客目录并执行：

```bash
cd /Users/zzz/code/myblog/blog
gh repo create myblog --public --source=. --remote=origin --push
```

这会创建公开仓库 `myblog` 并上传当前博客。网站地址将是：

```text
https://你的GitHub用户名.github.io/myblog/
```

如果希望网站地址没有 `/myblog/`，可以把仓库创建为：

```bash
gh repo create 你的GitHub用户名.github.io --public --source=. --remote=origin --push
```

对应网站地址是：

```text
https://你的GitHub用户名.github.io/
```

两种仓库名称都能正常工作，部署脚本会自动处理路径。

### 3. 开启 GitHub Pages

进入 GitHub 仓库页面：

```text
Settings -> Pages -> Build and deployment -> Source
```

选择 `GitHub Actions`。然后进入仓库的 `Actions` 页面，等待 `Deploy Hexo to GitHub Pages` 变成绿色。

首次部署通常需要一到几分钟。部署完成后，任务页面会显示网站地址。

## 四、以后更新文章

每次新增或修改文章后执行：

```bash
cd /Users/zzz/code/myblog/blog
git add .
git commit -m "更新博客文章"
git push
```

推送完成后，GitHub Actions 会自动重新发布网站，不需要手动上传 `public` 目录。

查看部署状态：

```bash
gh run list --workflow pages.yml
```

## 五、常用命令

```bash
# 创建文章
pnpm exec hexo new post "文章标题"

# 清理缓存
pnpm exec hexo clean

# 生成网站
pnpm exec hexo generate

# 本地预览
pnpm exec hexo server -p 4001

# 上传更新
git add .
git commit -m "更新博客"
git push
```

## 六、注意事项

- 不要提交 `node_modules`、`public` 和 `db.json`，它们已经写入 `.gitignore`。
- 日常只修改 `source/`、`_config.yml` 和 `_config.butterfly.yml` 等源文件。
- GitHub Actions 会根据仓库名称自动设置站点路径。
- 更换域名后，需要同时修改 `_config.yml` 中的 `url`，并在 `source/` 下增加 `CNAME` 文件。
