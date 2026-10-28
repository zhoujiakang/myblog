# Zzz技术小筑 · Vue 学习博客

基于提供的 `idea/blog-site` UI 复刻，采用 Vue 3、TypeScript、Vite 和 Vue Router。保留五套主题、首页封面、文章时间线、分类与标签索引、双栏阅读页及移动端布局。

文章以 Markdown 存入 Git 仓库，无线上数据库。**本地可以写作；公开构建不含编辑页面、写作接口或草稿数据。**

## 环境与启动

使用 Node.js 22.12 或更新的兼容版本，推荐 Node.js 22 LTS。

```bash
cd myblog
npm ci
npm run dev
```

访问终端显示的地址，默认是 <http://127.0.0.1:5273/>。点击「写作」进入本地编辑器。

也可使用脚本：

```bash
./scripts/start-local.sh
```

本地服务只监听回环地址。端口冲突时可用 `npm run dev -- --port 5274`。

## 两种模式

| 命令                 | 用途                  | 本地编辑器             | 草稿                         |
| -------------------- | --------------------- | ---------------------- | ---------------------------- |
| `npm run dev`        | 本地浏览与写作        | 有                     | 编辑器可加载，公开列表不展示 |
| `npm run dev:public` | 开发环境检查公开界面  | 无                     | 排除                         |
| `npm run build`      | GitHub Pages 公开构建 | 无，相关代码被编译移除 | 排除                         |
| `npm run preview`    | 预览上一次 dist 构建  | 无                     | 排除                         |

完整公开构建脚本：

```bash
./scripts/build-public.sh
npm run preview
```

`dist/` 可以部署到任何静态服务器。Vue Router 使用 Hash 路由，刷新文章链接不依赖服务端重写规则。

## 在浏览器里写文章

1. 本地启动后，进入导航栏的「写作」。
2. 填写标题、摘要、日期、分组、标签与正文。
3. 文章标识使用小写英文、数字、短横线，例如 `mysql-index-notes`。它决定文件名和文章链接，保存后固定。
4. 点击「保存草稿」或「保存文章」，内容会落盘到 `content/posts/<文章标识>.md`。
5. 在「已有文章 / 草稿」中可以重新加载并编辑。导入 Markdown 会作为新文章处理，不会自动覆盖已有文件。
6. 保存后自行提交并推送 Git。编辑器不会自动 commit、push 或发布。

支持 YAML 元数据 Markdown 导入；普通 Markdown 也可以导入，导入后补全日期、分组等信息。文件限制 2 MB。可导出 Markdown 备份。

正文输入会尝试写入浏览器恢复缓存，并在下次进入时询问恢复；**点击保存后的文件才是可靠来源**。保存已有文件时会校验版本，检测到其他窗口或外部编辑器的修改后会拒绝覆盖。

图片放在 `public/media/`，正文写 `![图片说明](media/example.png)`。构建会自动补齐部署子路径；暂不提供浏览器图片上传。

## 直接编辑 Markdown

```markdown
---
title: '我的第一篇文章'
summary: '用一两句话介绍文章内容。'
date: '2026-10-27'
group: 'Java'
tags: ['Spring Boot', '性能优化']
draft: false
---

## 问题背景

从这里开始写正文。
```

- 文件位于 `content/posts/`，例如 `my-first-post.md`，只读取此目录下的 `.md` 文件。
- 必填：`title`、`date`、`group`、`tags`。`summary` 默认空，`draft` 默认 false。
- `date` 使用真实日历日期，格式为 YYYY-MM-DD。日期用于排序，不用于定时发布。
- 一个分组、多个标签。新分组自动出现在分类页；可在 `config/site.json` 中补充 slug 与说明。
- 同组文章按日期排序，列表默认最新在前，可切换最早在前；阅读页上一篇表示较早文章，下一篇表示较新文章。
- 搜索匹配标题、摘要、正文、分组和标签；多个空格分隔的关键词需要同时匹配。
- 搜索、分组、标签和排序保存在 URL 中，返回文章列表会保留条件及滚动位置。
- 为防止文章元数据错误被静默发布，格式不合法会使构建失败，并标明出错文件。

Markdown 原始 HTML 不会执行；代码块支持语法高亮和复制，目录自动生成。

## 修改个人信息

编辑 `config/site.json`：博客名、个人介绍、首页文案、头像文字、技术栈、邮箱、GitHub 地址和预设分组。

博客初始为空，不包含示例文章或草稿。通过本地写作页新建文章，或按上面的格式添加 Markdown 文件即可。

## 部署到 GitHub Pages

当前自定义域名为 `blog.zzzink.cn`，GitHub Pages 使用 GitHub Actions 发布。域名绑定在仓库的 Pages 设置中维护，`public/CNAME` 会随构建复制到产物。切换域名后需要重新构建，以便 Pages 元数据生成正确的资源根路径。

**将这个 `blog/` 目录作为独立 GitHub 仓库的根目录。** 工作流位于其 `.github/workflows/deploy.yml`，默认部署 main 分支。

首次提交示例（将 `<仓库地址>` 替换为自己的地址）：

```bash
cd myblog
git init -b main
git add .
git commit -m "feat: initialize Vue blog"
git remote add origin <仓库地址>
git push -u origin main
```

在 GitHub 仓库打开 **Settings → Pages → Build and deployment → Source → GitHub Actions**。然后手动运行部署工作流，或再推送一次 main。

工作流会安装依赖、运行测试、从 Pages 元数据获取部署子路径、构建公开版本、检查编辑器与演示草稿未进入产物，然后上传并部署 `dist/`。支持个人主页仓库、普通项目仓库和 Pages 配置的自定义域名。

> 如果希望把 `blog/` 留在更大的 Git 仓库中，需要把工作流移到该仓库根目录的 `.github/workflows/`，并调整安装、缓存、构建的工作目录以及上传路径为 `blog/dist`。

本地验证普通项目仓库的子路径：

```bash
BASE_PATH=/my-blog/ SITE_URL=https://your-name.github.io npm run build
npm run verify:public
BASE_PATH=/my-blog/ npm run preview
```

访问预览地址下的 `/my-blog/`。`BASE_PATH` 必须以 `/` 开头和结尾；默认 `/`。配置 `SITE_URL` 后额外生成 `rss.xml`。

后续写作只需要：

```bash
git add content/posts public/media
git commit -m "docs: publish article"
git push
```

草稿不会进入网站，但公开 Git 仓库中的草稿源文件仍可被查看。只把适合进入仓库的内容保存到 `content/posts/`。

此实现是静态托管的 Vue 单页应用，页面在浏览器中渲染，没有服务端渲染或预渲染；若后续重视搜索引擎收录，可以在保持 UI 的基础上增加预渲染。

## 目录规范

```text
blog/
├── config/site.json          # 博客与个人信息
├── content/posts/            # Markdown 文章，Git 是内容来源
├── public/media/             # 公开图片
├── src/
│   ├── components/           # 导航、侧栏、时间线、目录等可复用组件
│   ├── composables/          # 文章数据、分组标签派生数据
│   ├── router/               # 公开路由与编译期本地路由开关
│   ├── views/                # 首页、文章、分类标签、阅读、关于、编辑页
│   ├── styles/               # 原设计样式与功能补充样式
│   └── types/                # 文章与输入类型
├── server/
│   ├── content.mjs           # Node 端解析、校验、渲染及文件保存
│   └── plugin.mjs            # Vite 内容模块与仅本地提供的编辑 API
├── scripts/                  # 本地启动、公开构建和产物验证
├── test/                     # 内容处理与本地接口测试
└── .github/workflows/        # GitHub Pages 自动部署
```

公开页面的依赖不包含 Node 文件系统、Markdown 解析器、本地编辑接口或编辑页。内容在构建期间读取，浏览器只接收公开文章的元数据、正文及渲染结果。

## 验证

```bash
npm test
npm run build
npm run verify:public
```

测试覆盖元数据解析与校验、日期排序、草稿排除、路径与重名限制、修改冲突、安全 Markdown 渲染、部署子路径图片、本地编辑接口和公开接口隔离。

GitHub Pages 配置参考：[GitHub 官方文档](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)。
