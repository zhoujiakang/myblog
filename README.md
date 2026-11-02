# zzZ · makes things.

个人站点前端 —— Vue 3 + Vue Router + Vite，暖米白设计系统，可部署到 GitHub Pages。

## 本地开发

```bash
npm install
npm run dev      # 本地预览 http://localhost:5173
npm run build    # 构建产物输出到 dist/
npm run preview  # 预览构建产物
```

## 页面结构

| 路由 | 页面 | 说明 |
| --- | --- | --- |
| `#/` | 首页 | Hero（融合插画）+ 栏目入口卡 + 联系 CTA |
| `#/works` | 作品 | 6 个项目卡 |
| `#/skills` | 技能 | 全栈 / Agent 开发 / 工具与协作 |
| `#/articles` | 文章 | 5 条文章列表 |
| `#/about` | 关于我 | 简介 + 数据 + Now + 联系 |

> 路由用的是 **hash 模式**（URL 里有 `#`）。因为 GitHub Pages 是纯静态托管、没有服务端重写，
> 用 hash 可以保证任意页面直接刷新 / 分享链接都不会 404。

## 上线到 GitHub Pages

1. 在 GitHub 建好仓库，把代码推到 `main` 分支。
2. 打开仓库 **Settings → Pages**，把 **Source** 选成 **GitHub Actions**。
3. 推一次代码（或手动触发 Actions），`.github/workflows/deploy.yml` 会自动构建并部署。
4. 部署完成后，Actions 日志里会给出访问地址。

仓库名如果不是 `<用户名>.github.io`，站点地址会是 `https://<用户名>.github.io/<仓库名>/`。
本项目 `vite.config.js` 里 `base: './'` 是相对路径，两种地址都能正常访问，不需要改配置。

## 上线前需要替换的占位内容

- `src/site.js`：邮箱（`hello@example.com`）和 X / Twitter 链接。
- 各页面里的项目、文章、简介文案目前是设计稿的占位内容，换成你真实的作品与文章。
- `src/assets/` 里三张图：`hero.png`（首页插画）、`avatar.png`（关于页头像）、`dog.png`（页脚吉祥物）。

## 设计系统

| Token | 值 | 用途 |
| --- | --- | --- |
| `--bg` | `#FBF7F0` | 页面米白底 |
| `--ink` | `#222220` | 主文字 |
| `--muted` | `#6F6A5E` | 次要文字 |
| `--faint` | `#9A9488` | 标签/日期 |
| `--accent` | `#C98A1E` | 暖橙标签、数字 |
| `--yellow` | `#F2B441` | 手绘黄（按钮、描边、星） |

字体：Inter Black（大标题）/ Barlow Bold（卡片标题）/ Roboto Mono（导航、标签、数据）/ Inter Regular（正文）。
