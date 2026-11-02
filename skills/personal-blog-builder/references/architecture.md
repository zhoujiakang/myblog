# 工程结构

## 一、技术选型与理由

| 选择 | 理由 | 什么时候该换 |
| --- | --- | --- |
| Vue 3 `<script setup>` | 单文件组件，视图和样式在一起，一个人一下午能读完 | 团队已经在用 React |
| Vite | 冷启动快，`import.meta.glob` 让内容构建期内联 | 无 |
| vue-router **hash 模式** | GitHub Pages 是纯静态托管，没有 history fallback | 换 Netlify/Vercel，或做预渲染 |
| Markdown + 极简 frontmatter | 用户改内容不用碰代码 | 需要富文本编辑 / CMS / 多人协作 |
| 无 UI 框架、无 Pinia、无 TS | 这套方案的价值是"能读完、改得动" | 站点要长成产品（登录、评论、后台） |

**hash 模式不是偏好，是被托管方式逼的。** 换成 `createWebHistory()` 后，用户直接刷新 `/#/articles/xx` 之外的任何子路径都会 404——因为静态服务器上没有对应的文件。除非同时做预渲染或换托管，否则不要改。

如果用户明确要"干净的 URL、不要井号"，正确做法是换到 Cloudflare Pages / Netlify（配一条 rewrite 到 index.html），而不是硬改成 history 模式。

---

## 二、目录结构

```
index.html            单入口，head 留占位注释，meta 由插件注入
vite.config.js        base './' + injectMeta 插件（构建时注入 SEO/OG）
content/              全站文案与数据（见 content-schema.md）
public/               og-cover.png、CNAME
src/
  main.js             注册指令 + 引入自托管字体
  content.js          ★ 内容层：glob 读取、解析 frontmatter、自动统计
  App.vue             外壳：导航 + <RouterView> + 页面过渡
  router/index.js     路由表（按栏目生成）+ 全局 404 兜底
  views/              每个栏目一列表页 + 可选一详情页
  components/         导航 / 页脚 / 页头 / 空状态 / 详情外壳 / 404
  composables/        可复用的组合式逻辑（复制、滚动等）
  directives/         自定义指令（滚动揭示）
  styles/
    global.css        结构层：网格、字阶、通用类、动效
    themes/*.css      风格层：令牌（见 styles.md）
```

**栏目的目录名可以换。** `views/` 下叫什么、`content/` 下开哪些目录，都跟着访谈结果走。上面的 `works/skills/articles` 只是最常见的一种组合，不是规定。

---

## 三、数据流

```
content/*.md
  ── import.meta.glob('../content/**/*.md', { query: '?raw', eager: true })
  ── parseFrontmatter()
  ── readList(dir) / readItem(dir, slug)
  ── 导出 site / home / <各栏目数组> / about
  ── 视图直接 import，无 fetch、无 loading 态
```

内容在**构建期内联**进 bundle：没有运行时请求、没有首屏闪烁。代价是内容改动必须重新 build（dev 下自动热更新）。

`eager: true` 是关键——去掉它就会变成异步加载，首屏会闪一下。

内容层的核心职责就三件，多一件都别加：

1. **解析**：`---` 之间按第一个冒号切分。
2. **索引**：目录 → 数组，每项带 `slug`。
3. **派生**：需要算的数字（条数、年限）在这里算，不要散到视图里。

具体实现可以直接看参考实现里的 `src/content.js`——它不到 80 行，比看说明快。**但不要整份复制**：用户开的栏目不一样，数组和导出面就要跟着变。

---

## 四、路由：跟着栏目走

每个集合型栏目两条路由（列表 + 详情），条目型和单体页一条。

```js
const routes = [
  { path: '/', component: HomeView },
  { path: '/works', component: WorksView },
  { path: '/works/:slug', component: WorkDetail },
  { path: '/articles', component: ArticlesView },
  { path: '/articles/:slug', component: ArticleDetail },
  { path: '/about', component: AboutView },
  { path: '/:pathMatch(.*)*', component: NotFound },   // 必须有
]
```

**最后一个 catch-all 不能省。** 没有它，访问不存在的地址会白屏——静态托管返回 200 但路由匹配不上，用户看到一片空白，只能刷新退回首页。

---

## 五、增删栏目

### 加一个栏目

1. 定类型（集合型 / 条目型 / 单体页），决定要不要详情页。
2. `content/<栏目名>/` 建目录 + `.gitkeep`。
3. `content.js` 加 `export const <name> = readList('<name>')`，集合型再加 `get<Name>(slug)`。
4. 路由加 1–2 条。
5. 视图：条目型复制列表页改字段；集合型再加一个详情页（改 `getXxx` 和 `back-to`）。
6. `site.md` 补 `{page}Label/Title/Intro` + `empty{Page}*`，`nav` 加一项。
7. `content/home/` 加一张入口卡（或调整卡片墙布局）。
8. `npm run build` 验证，访问一次新路由和一个不存在的 slug。

**第 6 步最容易漏。** 漏了 PageHeader 会出现"页面能进但标题空白"，而且构建不报错。

### 删一个栏目

反过来做一遍，另外注意两件事：

- 删掉后 `nav` 少一项，检查导航在移动端是否需要重新分配空间。
- 被删栏目的内容**先问用户要不要保留 md 文件**，别直接删——那是他的产出。

### 改栏目名

栏目名出现在四处：目录名、路由 path、`site.md` 的 key 前缀、导航标签。**四处必须一起改**，改一半会出现"页面正常但导航点了 404"。

如果已经分享出去过链接，改 path 就等于废掉那些链接。要么加一条重定向，要么接受失效并告诉用户。

---

## 六、体积基线

- JS ≈ 120 kB（gzip 47 kB）、CSS ≈ 29 kB（gzip 5 kB）。**图片是唯一大头。**
- 大图放 `src/assets/` 交由 Vite 处理 hash 与压缩；需要固定 URL 的（OG 图、CNAME）放 `public/`。
- 字体只引需要的字重（400/700/900 之类），引整套会让首屏拖几百 KB。
- 动效只碰 `opacity` + `transform`，不碰 `top/left/width`，避免重排。

超标时先查图片：一张 2MB 的 PNG 就能抵掉整个 bundle。

---

## 七、什么时候不该用这套

诚实一点，以下情况直接说清楚，别硬做：

- **要登录、评论、后台编辑** —— 这套没有后端。要么接第三方（Giscus 评论、Decap CMS），要么换方案。
- **要几百篇文章 + 全文搜索** —— 构建期全量内联会变慢，该换 Astro/Next + 增量构建。
- **要多人协作写内容** —— Markdown + git 对非技术用户不友好，该上 CMS。
- **要电商、预约、支付** —— 完全超出范围。

说"这套不含 X，需要的话我们换方案或加第三方"，比硬塞一个残废实现体面。
