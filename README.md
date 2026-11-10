<div align="center">
  <img src="public/img/logo-me.png" width="72" alt="zzZ" />

  # Zblog

  **一个手绘风的个人博客：文章、折腾记录、分类、标签、归档、关于。**

  [在线站点](https://blog.zzzink.cn) · [快速开始](#快速开始) · [写内容](#写内容) · [部署](#部署)

  React 18 · Vite 5 · 内容用 Markdown 写 · 部署在 GitHub Pages
</div>

<p align="center">
  <img src=".github/assets/home-full.png" width="88%" alt="首页" />
</p>

## 关于我

zzZ，2025 年 9 月开始写代码，从 Java 入门，现在做全栈和 Agent 方向的开发。

这个博客记录技术笔记、踩坑经验，以及做过的项目（[折腾记录](https://blog.zzzink.cn/#/works)）。联系方式在站点关于页的名片里，点一下就能复制。

## 使用方法

### 快速开始

```
npm install
npm run dev      # http://localhost:5173
npm run build    # 产物输出到 dist/
npm run check    # 内容派生与页面不变量自检
```

### 写内容

在 `src/content/posts/` 新建 `.md`，文件名即 URL：

```
---
title: 把博客写成一间可以住很久的房间
slug: blog-as-a-room
date: 2026-09-28
category: 写作
time: 14:30           # 可选，同日多篇时的先后
order: 1              # 可选，分类内顺序（数字小的在前），时间不再是唯一标准
pinned: true          # 可选，置顶精选
tags: [写作, 长期主义]
summary: 一句话摘要。
---
```

新分类不用配置颜色——会自动从预设色板里按分类名取一个固定颜色；想手动指定时在 `config.json` 的 `categoryTones` 里写一行覆盖即可。

折腾记录放 `src/content/works/`，多一个 `kind`（项目/技能）和 `status`（在搞/搞定）字段。全站文案与联系方式在 `src/content/site/` 的三个 JSON 里，改完刷新即可。字数、阅读时长、目录、归档、推荐全部自动派生。

### 部署

双分支模型：**main 是代码与文档的权威分支，文章只在 content 分支**。发布由 `.github/workflows/deploy.yml` 完成，Pages 的构建类型是 `workflow`，不从分支直出。

- **写文章**：在 `content` 分支的 `src/content/posts/` 新建 `.md`，commit 后 `git push origin content`，自动构建发布
- **改代码 / 改文档**：以 `main` 为准，改完提交到 main，再在 content 分支用
  `git checkout main -- <文件路径>` 同步过来，然后 push content 发布。
  不要直接 `git merge main`：main 的历史里删过文章，合并会撞上 modify/delete 冲突
- **手动重跑**：`npm run deploy` 触发一次 `workflow_dispatch`，本地不上传产物，需要本机装好并登录 `gh`
- 自定义域名靠 `public/CNAME` 保持，它随 `dist/` 一起上传，别删

一次 push 的链路：`checkout content` → `npm ci` → `npm run build`（MDX 在构建期把文章编译进 JS）→ 上传 `dist` 产物 → `deploy-pages` 发布。`npm run check` 只在本地跑，CI 不跑它。

两个前置条件容易漏：

- 工作流文件只放在 **content** 分支：push 事件读的是被推送分支上的工作流，main 上没有它就不会触发部署，也避免从 main 手动触发时发布一份没有文章的站点
- 仓库 `Settings → Environments → github-pages` 的部署分支白名单至少包含 `content`（当前为 content、gh-pages、main）。缺了 content 时 build 照常成功、deploy 被环境保护规则拒绝，push 本身不报错，线上会静默停留在上一次成功的产物

确认是否真的上线，看 Actions 的运行结论，或检查线上 `assets/index-*.js` 里有没有新文章标题；浏览器缓存可能仍需强刷。

## 边界

- 没有后端、没有评论；几百篇文章起步时该考虑 Astro / Next。
- 没有后台编辑器：内容就是 Markdown，用任何编辑器写、commit 并 push content 后由 Actions 构建发布。

* * *

<div align="center">
  Built with code and agents · 2026
</div>
