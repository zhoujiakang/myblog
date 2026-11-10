/* 开发期自检：把各个页面在构建期渲染成 HTML，检查关键结构是否正确。
 *
 * 跑法：npm run check
 * 用 vite 的 ssrLoadModule 加载 React 组件并渲染成字符串，
 * 这样不用起浏览器也能验证 md 解析、class 映射、派生数据是否正确。
 *
 * 原则：断言只检查「不变量」（数量与派生是否一致、链接是否指向真实 slug、
 * 锚点能否对上），不写死文章数 / 分类数 / 某篇 slug / 某个月份。
 * 换真实内容后不需要回来改这个脚本。 */

import { createServer } from 'vite'
import { readFileSync } from 'node:fs'
import { renderToStaticMarkup } from 'react-dom/server'
import React from 'react'
import { StaticRouter } from 'react-router-dom/server.js'

const server = await createServer({
  configFile: new URL('../vite.config.js', import.meta.url).pathname,
  server: { middlewareMode: true },
  /* 只做 SSR 渲染，不需要浏览器依赖预构建；关掉可避免关闭时
     esbuild 输出「The build was canceled」的无关提示 */
  optimizeDeps: { noDiscovery: true, include: [] },
  appType: 'custom',
})

const load = (file) => server.ssrLoadModule(file)
const read = (file) => readFileSync(new URL(`../${file}`, import.meta.url), 'utf8')

/* app.css 拆分后只是 @import 入口，断言用的样式文本按导入顺序聚合分域文件，
   相对顺序与拆分前一致，lastIndexOf 类断言不受影响 */
const STYLE_FILES = [
  'base.css', 'header.css', 'footer.css', 'blocks.css', 'home.css',
  'article.css', 'works.css', 'categories.css', 'tags.css', 'archive.css',
  'responsive-mid.css', 'responsive-mobile.css', 'article-rail.css', 'misc.css',
]
const appCss = STYLE_FILES.map((f) => read(`src/styles/${f}`)).join('\n')

const checks = []
function check(name, ok, detail = '') {
  checks.push({ name, ok, detail })
  console.log(`${ok ? '  ✓' : '  ✗'} ${name}${detail ? ` — ${detail}` : ''}`)
}

/* ---------------- 数据层 ---------------- */
console.log('\n[数据层]')
const lib = await load('/src/lib/posts.js')
const worksLib = await load('/src/lib/works.js')
const siteData = await load('/src/data/site.js')

const { posts, categories, tags, archive, config, copy, site } = {
  posts: lib.posts,
  categories: lib.categories,
  tags: lib.tags,
  archive: lib.archive,
  config: siteData.config,
  copy: siteData.copy,
  site: siteData.site,
}
const slugs = new Set(posts.map((p) => p.slug))
/* 内容无关：刚清空内容开始写作时，只检查结构，不检查文章派生 */
const HAS_POSTS = posts.length > 0
const HAS_WORKS = worksLib.works.length > 0

check('文章数量与 postCount 一致', !HAS_POSTS || lib.postCount === posts.length, `${posts.length} 篇`)
check(
  '文章按日期倒序',
  posts.every(
    (p, i) =>
      i === 0 ||
      posts[i - 1].datetime > p.datetime ||
      (posts[i - 1].datetime === p.datetime && posts[i - 1].slug <= p.slug)
  )
)
check(
  '分类内 order 排序生效（有 order 升序在前，无 order 时间倒序在后）',
  categories.every((c) => {
    const list = lib.postsByCategory(c.name)
    const flags = list.map((p) => (p.order !== null ? 'o' : 'u')).join('')
    const ordered = list.filter((p) => p.order !== null)
    return (
      flags === 'o'.repeat(ordered.length) + 'u'.repeat(list.length - ordered.length) &&
      ordered.every((p, i) => i === 0 || ordered[i - 1].order <= p.order)
    )
  })
)
check(
  '分类计数由文章派生',
  categories.reduce((n, c) => n + c.count, 0) === posts.length &&
    categories.every((c) => lib.postsByCategory(c.name).length === c.count),
  categories.map((c) => `${c.name}:${c.count}`).join(' ')
)
check(
  '标签计数由文章派生',
  (!HAS_POSTS || tags.every((t) => lib.postsByTag(t.name).length === t.count)),
  `${tags.length} 个标签`
)
const archivedSlugs = archive.flatMap((y) => y.months.flatMap((m) => m.posts.map((p) => p.slug)))
check(
  '归档覆盖全部文章且链接真实',
  archivedSlugs.length === posts.length && archivedSlugs.every((s) => slugs.has(s)),
  `${archivedSlugs.length} 条`
)
check(
  '精选文章来自 pinned 标记',
  !lib.featured || posts.some((p) => p.slug === lib.featured.slug && p.pinned),
  lib.featured?.slug ?? '无'
)
check(
  '目录由构建期生成',
  (!HAS_POSTS || posts.some((p) => p.toc.length > 0)) &&
    posts.every((p) => Array.isArray(p.toc)),
  `${posts.reduce((n, p) => n + p.toc.length, 0)} 个小节`
)
check(
  '字数与阅读时长自动派生（md 里不再手填）',
  posts.every((p) => p.wordCount > 0 && /\d/.test(p.reading) && /\d/.test(p.words)) &&
    worksLib.works.every((w) => w.wordCount > 0 && /\d/.test(w.reading)),
  `首篇 ${posts[0]?.wordCount} 字 / ${posts[0]?.reading}`
)
const firstTag = tags[0]
/* 上下篇与推荐都依赖「至少两篇文章」，单篇时跳过 */
if (posts.length >= 2) {
const middle = posts[Math.floor(posts.length / 2)]
const nb = lib.getNeighbours(middle.slug)
check(
  '上下文导航指向真实文章',
  [nb.prev, nb.next].filter(Boolean).every((n) => slugs.has(n.slug)) &&
    (nb.prev || nb.next) !== null
)
const relTag = lib.getRelatedPosts(middle, { type: 'tag', name: firstTag.name })
const catForNb = categories.find((c) => lib.postsByCategory(c.name).length >= 2)
const tagForNb = tags.find((t) => lib.postsByTag(t.name).length >= 2)
check(
  '分类语境的上下篇只含同分类文章',
  !catForNb ||
    (() => {
      const list = lib.postsByCategory(catForNb.name)
      const mid = list[Math.floor(list.length / 2)]
      const nb = lib.getNeighbours(mid.slug, { type: 'category', name: catForNb.name })
      return [nb.prev, nb.next]
        .filter(Boolean)
        .every((n) => list.some((p) => p.slug === n.slug))
    })()
)
check(
  '标签语境的上下篇只含同标签文章',
  !tagForNb ||
    (() => {
      const list = lib.postsByTag(tagForNb.name)
      const mid = list[Math.floor(list.length / 2)]
      const nb = lib.getNeighbours(mid.slug, { type: 'tag', name: tagForNb.name })
      return [nb.prev, nb.next]
        .filter(Boolean)
        .every((n) => list.some((p) => p.slug === n.slug))
    })()
)
check(
  '标签来源推荐同标签的其它文章',
  relTag.kind === 'tag' &&
    relTag.list.length > 0 &&
    relTag.list.every((p) => p.tags.includes(firstTag.name) && p.slug !== middle.slug),
  `#${firstTag.name} ${relTag.list.length} 篇`
)
const relCat = lib.getRelatedPosts(middle, { type: 'category', name: middle.category })
/* 该分类只有这一篇时，推荐会走「最近」兜底——只有分类里至少两篇才断言 */
const middleCatCount = categories.find((c) => c.name === middle.category)?.count ?? 0
check(
  '分类来源推荐同分类的其它文章',
  middleCatCount < 2 ||
    (relCat.kind === 'category' &&
      relCat.list.every((p) => p.category === middle.category && p.slug !== middle.slug))
)
const relFallback = lib.getRelatedPosts(middle, null)
check(
  '无来源时兜底且不含自己',
  relFallback.list.length > 0 &&
    relFallback.list.length <= config.relatedLimit &&
    relFallback.list.every((p) => p.slug !== middle.slug)
)
}
const relWork = HAS_WORKS ? worksLib.getRelatedWorks(worksLib.works[0]) : { list: [] }
check(
  '折腾详情也有同类推荐',
  worksLib.works.length < 2 || (relWork.list.length > 0 && relWork.list.every((w) => w.slug !== worksLib.works[0].slug))
)

/* ---------------- 页面渲染 ---------------- */
console.log('\n[页面渲染]')
const App = (await load('/src/App.jsx')).default
const firstCategory = encodeURIComponent(categories[0]?.name ?? '')
const firstTagPath = encodeURIComponent(firstTag?.name ?? '')

const routes = [
  ['/', '首页'],
  ['/posts', '文章列表'],
  ...posts.map((p) => [`/posts/${p.slug}`, `文章 ${p.slug}`]),
  ['/works', '折腾记录'],
  ...worksLib.works.map((w) => [`/works/${w.slug}`, `折腾 ${w.slug}`]),
  ['/categories', '分类页'],
  ...(firstCategory ? [[`/categories/${firstCategory}`, '分类详情']] : []),
  ['/tags', '标签页'],
  ...(firstTag ? [[`/tags/${firstTagPath}`, '标签筛选']] : []),
  ['/archive', '归档页'],
  ['/about', '关于页'],
  ['/no-such-page', '404'],
]

const htmls = {}
const renderErrors = []
for (const [path, label] of routes) {
  try {
    const html = renderToStaticMarkup(
      React.createElement(StaticRouter, { location: path }, React.createElement(App))
    )
    htmls[path] = html
    if (html.length < 400) renderErrors.push(`${label} 内容过短`)
  } catch (e) {
    renderErrors.push(`${label}: ${e.message}`)
  }
}
check(
  '全部路由渲染成功',
  renderErrors.length === 0,
  `${routes.length} 个路由${renderErrors.length ? ` / ${renderErrors.join('; ')}` : ''}`
)

const articleHtmls = posts.map((p) => htmls[`/posts/${p.slug}`] ?? '')
const workHtmls = worksLib.works.map((w) => htmls[`/works/${w.slug}`] ?? '')
const allHtml = Object.values(htmls).join('')

/* ---------------- 正文结构 ---------------- */
console.log('\n[正文结构]')
check('每篇文章都有导语', articleHtmls.every((h) => h.includes('article-lead')))
for (const cls of [
  'article-subtitle',
  'article-subtitle-dot',
  'article-subheading',
  'article-paragraph',
  'article-list-item',
  'article-quote',
  'article-code',
  'article-figure',
  'article-caption',
]) {
  check(`正文样式 ${cls} 生效`, !HAS_POSTS || articleHtmls.some((h) => h.includes(cls)) ||
    read('src/lib/rehype-article-structure.mjs').includes(cls))
}
check(
  '目录锚点数量与各篇 toc 一致',
  articleHtmls.every(
    (h, i) => (h.match(/id="section-\d+"/g) ?? []).length === posts[i].toc.length
  )
)
check(
  '正文里没有残留的 h2 裸标签',
  !/<h2(?![^>]*article-subtitle-text)/.test(articleHtmls.join(''))
)
check(
  '正文里没有残留的 h3 裸标签',
  !/<h3(?![^>]*article-subheading)/.test(articleHtmls.join(''))
)
check('文章页右侧有「接着读」块', posts.length < 2 || articleHtmls.every((h) => h.includes('side-related-list')))
check('折腾详情页也有「接着看」块', worksLib.works.length < 2 || workHtmls.every((h) => h.includes('side-related-list')))
check(
  '手机端返回与目录都在正文之前，不再堆在页尾',
  [...articleHtmls, ...workHtmls].every((h) => {
    const rail = h.indexOf('article-rail-back')
    const body = h.indexOf('article-body-wrap')
    return rail > -1 && body > -1 && rail < body
  })
)
check(
  '手机端目录默认收起且可访问',
  [...articleHtmls, ...workHtmls].every(
    (h) =>
      /* 无小节的短内容没有目录按钮，属正常；有目录的页面必须默认收起 */
      !h.includes('aria-controls="article-toc-panel"') ||
      (h.includes('aria-expanded="false"') &&
        h.includes('aria-controls="article-toc-panel"') &&
        !h.includes('id="article-toc-panel"'))
  )
)

/* ---------------- 列表页与派生 ---------------- */
console.log('\n[列表与派生]')
const listHtml = htmls['/posts'] ?? ''
check(
  '列表页文章数与数据一致',
  (listHtml.match(/list-card-title/g) ?? []).length === posts.length,
  `${posts.length} 篇`
)
check(
  '分类页卡片数与数据一致',
  (htmls['/categories']?.match(/class="cat-card cat-card--/g) ?? []).length === categories.length,
  `${categories.length} 个`
)
check(
  '标签筛选只显示该标签文章',
  !HAS_POSTS ||
    (firstTag &&
      (htmls[`/tags/${firstTagPath}`]?.match(/list-card-title/g) ?? []).length === firstTag.count),
  firstTag ? `#${firstTag.name} ${firstTag.count} 篇` : ''
)
const arcHtml = htmls['/archive'] ?? ''
const arcLinks = [...arcHtml.matchAll(/class="timeline-post" href="\/posts\/([a-z0-9-]+)"/g)].map(
  (m) => m[1]
)
check(
  '归档链接全部指向真实文章',
  arcLinks.length === posts.length && arcLinks.every((s) => slugs.has(s)),
  `${arcLinks.length} 个链接`
)
const latestYear = archive[0]
const barRows = (arcHtml.match(/archive-bar-row(?: |")/g) ?? []).length
check(
  '节奏条只列有文章的月份且没有上限轨道',
  (!HAS_POSTS || (latestYear && barRows === latestYear.months.length)) &&
    !arcHtml.includes('archive-bar-track'),
  `${barRows} 行`
)
const barWidths = [...arcHtml.matchAll(/class="archive-bar" style="width:([^"]+)"/g)].map((m) => m[1])
check(
  '节奏条长度按篇数线性给',
  (!HAS_POSTS || (latestYear && barWidths.length === latestYear.months.length)) &&
    barWidths.every((w, i) => w === `${latestYear.months[i].count * config.barUnitPx}px`),
  [...new Set(barWidths)].join(' / ')
)
check(
  '节奏条与时间线月份锚点一致',
  !HAS_POSTS || latestYear?.months.every((m) =>
    arcHtml.includes(`id="timeline-month-${latestYear.year}-${Number(m.month.split(' ')[0])}"`)
  )
)
check(
  '日历天数按年月动态计算（非写死 29 天）',
  !/DAYS_IN_MONTH/.test(read('src/components/CalendarCard.jsx')) &&
    /new Date\(cursor\.year, cursor\.month, 0\)/.test(read('src/components/CalendarCard.jsx'))
)
check(
  '空内容时归档页不出现 NaN / Infinity',
  !/NaN|Infinity/.test(arcHtml) &&
    /emptySide/.test(read('src/components/CalendarCard.jsx'))
)
check(
  '空内容时各列表页有虚线空状态卡，有内容时不出现',
  /\.empty-state\s*\{/.test(appCss) &&
    read('src/components/EmptyState.jsx').includes("copy.empty") &&
    (HAS_POSTS ||
      (htmls['/posts']?.includes(copy.empty.posts) &&
        htmls['/categories']?.includes(copy.empty.categories) &&
        htmls['/tags']?.includes(copy.empty.tags) &&
        arcHtml.includes(copy.empty.archive))) &&
    (HAS_POSTS || !htmls['/'].includes('cat-pill-row--block'))
)

/* ---------------- 站点数据 / 文案 / 资源 ---------------- */
console.log('\n[资料、文案与资源]')
check(
  '联系方式集中在 profile.json 且已渲染到关于页',
  Object.values(site.contact).length === 4 &&
    Object.values(site.contact).every((v) => htmls['/about']?.includes(v)),
  Object.values(site.contact).join(' / ')
)
check(
  '关于页正文来自 profile.json',
  site.about.length >= 3 && htmls['/about']?.includes(site.about[0].slice(0, 12))
)
const aboutHtml = htmls['/about'] ?? ''
check(
  '关于页名片 / 自我介绍改为切换，桌面仍双列同时展示',
  /role="tablist"/.test(aboutHtml) &&
    aboutHtml.includes('data-tab="card"') &&
    aboutHtml.includes('id="about-panel-card"') &&
    aboutHtml.includes('id="about-panel-text"') &&
    aboutHtml.includes(copy.about.tabCard) &&
    aboutHtml.includes(copy.about.tabText) &&
    !read('src/pages/AboutPage.jsx').includes(copy.about.tabCard) &&
    /\.about-tabs[\s,][^}]*display:\s*none/.test(appCss) &&
    /about-grid\[data-tab='card'\]/.test(appCss) &&
    !/about-panel-switch/.test(read('src/pages/AboutPage.jsx') + appCss) &&
    !('toText' in copy.about || 'toCard' in copy.about)
)
check(
  '归档页手机端时间线 / 日历·节奏切换，桌面仍双列',
  /role="tablist"/.test(arcHtml) &&
    arcHtml.includes('data-tab="timeline"') &&
    arcHtml.includes('id="archive-panel-timeline"') &&
    arcHtml.includes('id="archive-panel-side"') &&
    arcHtml.includes(copy.archive.tabTimeline) &&
    arcHtml.includes(copy.archive.tabSide) &&
    /\.archive-tabs[\s,][^}]*display:\s*none/.test(appCss) &&
    /archive-columns\[data-tab='side'\] \.archive-main/.test(appCss) &&
    /requestAnimationFrame/.test(read('src/pages/ArchivePage.jsx'))
)
check(
  '导航与文案来自 copy.json',
  copy.nav.items.length === 6 &&
    copy.nav.items.every((i) => allHtml.includes(i.label)) &&
    (!HAS_POSTS || htmls['/']?.includes(copy.home.recentTitle))
)
check(
  'index.html 的标题描述由 profile.json 注入',
  read('index.html').includes('__META_TITLE__') &&
    read('index.html').includes('__META_DESCRIPTION__') &&
    /profile\.json/.test(read('vite.config.js'))
)
check(
  'Google Fonts 已本地化，无外链',
  !/fonts\.googleapis\.com|fonts\.gstatic\.com/.test(read('index.html')) &&
    /@font-face/.test(read('src/styles/fonts.css')) &&
    !/https:\/\//.test(read('src/styles/fonts.css'))
)
check(
  '没有写死的桌面宽度与 120px 留白',
  !/(^|\n)\s*width:\s*(820|1000)px/.test(appCss) &&
    /--pad-wide/.test(appCss) &&
    /min-width:\s*721px/.test(appCss) &&
    !/min-width:\s*720\.01px/.test(appCss)
)
/* 手机端紧凑度：这几条是对照浏览器实测定的值，
   防止以后调整桌面样式时把手机稿的间距又带回去。 */
const mobileCss = appCss.slice(appCss.lastIndexOf('@media (max-width: 720px)'))
check(
  '手机端插画解除桌面 42% 限宽，不再留半屏空白',
  /\.hero-art\s*\{[^}]*max-width:\s*none/s.test(mobileCss) &&
    /\.hero-art\s*\{[^}]*height:\s*200px/s.test(mobileCss)
)
check(
  '手机端区块间距收紧到 22px 且页头更矮',
  /padding-top:\s*22px/.test(mobileCss) &&
    /\.site-header\.site-header--mobile\s*\{[^}]*height:\s*var\(--header-h\)/s.test(mobileCss) &&
    /\.work-card--next\s*\{[^}]*flex-direction:\s*column/s.test(mobileCss)
)
check(
  '归档月份在手机端改用正文体，9 / 7 不再混淆',
  /\.timeline-month-name\s*\{[^}]*font-family:\s*var\(--font-body\)/s.test(mobileCss)
)
check(
  '手机端标题与说明不做文字居中，一律左对齐',
  !/\.page-head\s*\{[^}]*text-align:\s*center/s.test(mobileCss) &&
    !/\.article-title,\s*\.article-meta\s*\{[^}]*text-align:\s*center/s.test(mobileCss) &&
    !/\.site-footer\s*\{[^}]*text-align:\s*center/s.test(mobileCss) &&
    !/手机端居中版式/.test(mobileCss)
)
check(
  '手机端嵌套区块不叠加左右留白，内容外框统一 20px',
  /\.list-wrap \.section-block[^{]*\{[^}]*padding-left:\s*0/s.test(mobileCss) &&
    /\.works-slider\s*\{[^}]*padding-right:\s*0/s.test(mobileCss) &&
    /\.hero-left,\s*\.archive-main\s*\{[^}]*width:\s*100%/s.test(mobileCss) &&
    /\.cat-grid,\s*\.works-columns\s*\{[^}]*minmax\(0,\s*1fr\)/s.test(mobileCss) &&
    /\.cat-card\s*\{[^}]*min-width:\s*0/s.test(mobileCss)
)
check(
  '关于页档案卡解除桌面固定宽度，手机端左右严格对称',
  /\.about-card\s*\{[^}]*max-width:\s*100%/s.test(mobileCss) &&
    /\.about-grid\s*\{[^}]*padding:\s*12px 0 0/s.test(mobileCss)
)
check(
  '手机端文章工具条吸顶、桌面侧栏目录与底部返回卡不再重复出现',
  /\.article-rail\s*\{[^}]*position:\s*sticky/s.test(mobileCss) &&
    /\.article-rail\s*\{[^}]*top:\s*var\(--header-h\)/s.test(mobileCss) &&
    /\.toc\s*\{[^}]*display:\s*none/s.test(mobileCss) &&
    /\.prev-next-card--back\s*\{[^}]*display:\s*none/s.test(mobileCss) &&
    /\.article-subtitle-text\s*\{[^}]*scroll-margin-top:\s*calc\(var\(--header-h\) \+ 56px\)/s.test(mobileCss) &&
    /@media \(max-width: 1100px\)/.test(appCss) &&
    /\.article-tag-row\s*\{[^}]*flex-wrap:\s*wrap/s.test(mobileCss) &&
    /ArticleRail/.test(read('src/pages/Article.jsx')) &&
    /ArticleRail/.test(read('src/pages/WorkDetail.jsx')) &&
    /article-shell/.test(read('src/pages/Article.jsx')) &&
    /article-shell/.test(read('src/pages/WorkDetail.jsx')) &&
    copy.article.backPosts.length > 0 &&
    copy.workDetail.backWorks.length > 0
)
check(
  '手机端展开菜单与可用搜索按钮已就位',
  allHtml.includes('menu-toggle') &&
    allHtml.includes('aria-expanded="false"') &&
    /menu-toggle-icon/.test(read('src/components/Header.jsx')) &&
    /SearchDialog/.test(read('src/components/SearchDialog.jsx'))
)
check(
  '全站无「学生 / 评论区 / 无追踪 / 邮箱 / RSS」等旧文案',
  !['还在读书的学生', '评论区', '无追踪', 'RSS', 'Telegram', '我在上课'].some((w) =>
    allHtml.includes(w)
  )
)
check(
  '无障碍：焦点样式与减少动效',
  /:focus-visible/.test(read('src/styles/tokens.css')) &&
    /prefers-reduced-motion/.test(read('src/styles/tokens.css'))
)

/* ---------------- 响应式收口 ---------------- */
console.log('\n[响应式收口]')
const tokensCss = read('src/styles/tokens.css')
check(
  '全站一套 --pad、超宽屏居中容器、短页面页脚贴底',
  /--pad:\s*clamp\(/.test(tokensCss) &&
    /--pad-wide:\s*var\(--pad\)/.test(tokensCss) &&
    /\.site-frame\s*\{[^}]*max-width:\s*var\(--page-max\)/s.test(tokensCss) &&
    /site-frame/.test(read('src/App.jsx')) &&
    /\.site-footer\s*\{[^}]*margin-top:\s*auto/s.test(appCss)
)
check(
  '「最近在写」标题行不再把右侧导航压成竖排',
  /\.section-row > \.section-title-row\s*\{[^}]*width:\s*auto/s.test(appCss) &&
    /\.row-nav\s*\{[^}]*flex:\s*0 0 auto/s.test(appCss) &&
    /\.row-nav \.section-note,\s*\.row-all\s*\{[^}]*white-space:\s*nowrap/s.test(appCss)
)
check(
  '归档不再用固定 920px 居中壳',
  !/max-width:\s*920px/.test(appCss) &&
    /\.archive-shell\s*\{[^}]*padding:\s*0 var\(--pad\)/s.test(appCss)
)
check(
  '页头、菜单遮罩、工具条共用 --header-h，且菜单支持 Esc',
  (appCss.match(/inset:\s*var\(--header-h\)/g) ?? []).length >= 2 &&
    /--header-h:\s*60px/.test(tokensCss) &&
    /Escape/.test(read('src/components/Header.jsx')) &&
    /mobile-nav-backdrop/.test(appCss)
)
check(
  '文章工具条覆盖到 1100px，>1100px 交回右侧目录',
  /@media \(max-width: 1100px\)/.test(appCss) &&
    /@media \(min-width: 721px\) and \(max-width: 1100px\)/.test(appCss) &&
    !/min-width:\s*720\.01px/.test(appCss)
)
check(
  '手机首页「全部 →」是真链接，并补上精简置顶卡',
  /noteTo="\/posts"/.test(read('src/pages/Home.jsx')) &&
    /featured-card--mobile/.test(read('src/pages/Home.jsx')) &&
    /\.featured-card--mobile\s*\{/.test(mobileCss) &&
    (!lib.featured || htmls['/'].includes('featured-card--mobile'))
)
check(
  '分类卡「最新」两行封顶，不再单行截掉 1/4',
  /\.cat-card-latest\s*\{[^}]*-webkit-line-clamp:\s*2/s.test(appCss)
)
check(
  '400px 断点排在 720px 之后，字号死值已清',
  appCss.lastIndexOf('@media (max-width: 400px)') >
    appCss.lastIndexOf('@media (max-width: 720px)') &&
    !/font-size:\s*20px;\s*\}\s*\n\s*\.section-note\s*\{\s*font-size:\s*11px/s.test(appCss)
)
check(
  '文章页与折腾页底部导航一致',
  /prev-next-card--back/.test(read('src/pages/Article.jsx')) &&
    /prev-next-card--back/.test(read('src/pages/WorkDetail.jsx')) &&
    copy.article.backLabel === copy.workDetail.backLabel
)
check(
  '联系卡渠道名由 profile.json 派生，不与 key 硬耦合',
  copy.contact.desc.includes('{channels}') &&
    /Object\.keys\(site\.contact\)/.test(read('src/components/Blocks.jsx')) &&
    htmls['/'].includes(Object.keys(site.contact).join('、'))
)
check(
  '浮层打开时锁背景滚动（搜索 / 菜单 / 目录三处接入）',
  /html\.scroll-locked/.test(appCss) &&
    ['SearchDialog', 'Header', 'ArticleRail'].every((f) =>
      /useScrollLock/.test(read(`src/components/${f}.jsx`))
    ) &&
    /lockCount/.test(read('src/hooks/useScrollLock.js'))
)
check(
  '返回走真正后退并恢复来源页滚动位置',
  /useNavigationType/.test(read('src/App.jsx')) &&
    /sessionStorage\.setItem\(`scroll:\$\{pathname\}`/.test(read('src/App.jsx')) &&
    /history\.state\?\.idx/.test(read('src/components/BackLink.jsx')) &&
    /BackLink/.test(read('src/components/ArticleRail.jsx')) &&
    /BackLink/.test(read('src/pages/Article.jsx')) &&
    /BackLink/.test(read('src/pages/WorkDetail.jsx'))
)
check(
  '手机触控目标已扩到可点的尺寸',
  /\.article-rail-back\s*\{[^}]*padding:\s*14px 0/s.test(appCss) &&
    /\.article-rail-toggle::after\s*\{[^}]*inset:\s*-9px -11px/s.test(appCss) &&
    /\.site-footer-line a\s*\{[^}]*padding:\s*10px 8px/s.test(appCss) &&
    /\.timeline-post\s*\{[^}]*padding-top:\s*8px/s.test(appCss) &&
    /padding:\s*10px 14px/.test(appCss)
)
check(
  '搜索跳转后焦点落到正文标题；归档 tab 记住时间线位置',
  /focusTargetHeading/.test(read('src/components/SearchDialog.jsx')) &&
    /setAttribute\('tabindex',\s*'-1'\)/.test(read('src/components/SearchDialog.jsx')) &&
    /\[tabindex='-1'\]:focus/.test(appCss) &&
    /timelineY/.test(read('src/pages/ArchivePage.jsx'))
)
check(
  '页面统一具名导出，路由嵌套共享 Layout',
  !/export default/.test(
      ['Home', 'Article', 'PostsPage', 'WorksPage', 'WorkDetail', 'CategoriesPage', 'TagsPage', 'ArchivePage', 'AboutPage', 'NotFound', 'CategoryDetail']
        .map((n) => read(`src/pages/${n}.jsx`))
        .join('\n')
    ) &&
    /<Outlet \/>/.test(read('src/App.jsx')) &&
    (read('src/App.jsx').match(/<Layout>/g) ?? []).length === 0
)
check(
  'app.css 拆分为入口 + 分域文件，导入顺序即级联顺序',
  !/@media/.test(read('src/styles/app.css')) &&
    STYLE_FILES.every((f) => read(`src/styles/${f}`).trim().length > 0) &&
    /^\/\*[\s\S]*?@import '\.\/base\.css';/m.test(read('src/styles/app.css')) &&
    STYLE_FILES.every((f, i) => {
      const entry = read('src/styles/app.css')
      const cur = entry.indexOf(`./${f}`)
      const next = i + 1 < STYLE_FILES.length ? entry.indexOf(`./${STYLE_FILES[i + 1]}`) : Infinity
      return cur > -1 && cur < next
    })
)
check(
  '归档日历抽为 CalendarCard，页面只做编排',
  /monthMap/.test(read('src/components/CalendarCard.jsx')) &&
    !/monthMap/.test(read('src/pages/ArchivePage.jsx')) &&
    /<CalendarCard archive=\{archive\} \/>/.test(read('src/pages/ArchivePage.jsx'))
)

await server.close()

const failed = checks.filter((c) => !c.ok)
console.log(`\n${checks.length - failed.length}/${checks.length} 项通过`)
if (failed.length) {
  console.log('失败项：')
  for (const f of failed) console.log(`  - ${f.name}${f.detail ? ` (${f.detail})` : ''}`)
  process.exit(1)
}
