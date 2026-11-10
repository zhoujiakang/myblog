/* 文章数据层 —— 全部内容来自 src/content/posts/*.md，构建期解析。
 *
 * 流程：
 *   1. import.meta.glob 以 eager 模式在构建期把所有 .md 编译进产物
 *   2. 每个模块导出 default（正文组件）与 frontmatter（元数据）
 *   3. 分类、标签、归档、上下篇、目录、字数、阅读时长全部派生，不再手填
 *
 * 约定：slug 以 front matter 为准，缺失时回退到文件名。
 * 配色 / 数量上限 / 文案模板都在 src/content/site/ 下的 JSON 里。 */

import { config, copy, t } from '../data/site'

const modules = import.meta.glob('../content/posts/*.md', { eager: true })

/* 分类配色：categoryTones 里的条目是手动指定（覆盖项）；
   没写的分类自动从 tonePalette 里按名字哈希取一个——
   对同一个名字永远取到同一个颜色（构建间稳定），新增分类不用改 config */
function toneOf(category) {
  if (config.categoryTones[category]) return config.categoryTones[category]
  const palette = config.tonePalette ?? []
  let h = 0
  for (let i = 0; i < category.length; i++) h = (h * 31 + category.charCodeAt(i)) >>> 0
  return palette[h % palette.length] ?? config.defaultTone
}

/** 从 md 模块路径推 slug：../content/posts/foo-bar.md -> foo-bar */
function slugFromPath(path) {
  return path.split('/').pop().replace(/\.mdx?$/, '')
}

/** 规范化日期：front matter 里可能是 Date 对象或字符串，统一成 YYYY.MM.DD */
function formatDate(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  const pad = (n) => String(n).padStart(2, '0')
  return `${d.getFullYear()}.${pad(d.getMonth() + 1)}.${pad(d.getDate())}`
}

/** ISO 日期，给 <time datetime> 用 */
function isoDate(value) {
  if (!value) return ''
  const d = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(d.getTime())) return String(value)
  return d.toISOString().slice(0, 10)
}

/** datetime = 日期 + 可选时间（frontmatter time: HH:mm）。
    同一天多篇时用 time 定先后；都不写 time 则由 slug 兜底，顺序确定。
    直接拼字符串做字典序比较，避开 new Date 的时区换算。 */
function buildDatetime(date, time) {
  const day = isoDate(date)
  if (!day) return ''
  const raw = String(time ?? '').trim()
  const t = /^([01]?\d|2[0-3]):[0-5]\d$/.test(raw) ? raw.padStart(5, '0') : '00:00'
  return `${day}T${t}:00`
}

/** 分类内手动排序：frontmatter order（数字，小的在前）。未填或不合法返回 null */
function parseOrder(value) {
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}

/** 字数由 remark 插件统计原文得出；阅读时长按每分钟字数向上取整 */
function readingOf(wordCount) {
  const minutes = Math.max(1, Math.ceil((wordCount || 0) / config.wordsPerMinute))
  return t(copy.common.minutes, { count: minutes })
}

/* ---------------- 读取与排序 ---------------- */

const raw = Object.entries(modules).map(([path, mod]) => {
  /* remark-mdx-frontmatter 导出的键名是小写的 frontmatter */
  const fm = mod.frontmatter ?? mod.frontMatter ?? {}
  const wordCount = Number(fm.wordCount) || 0
  return {
    ...fm,
    slug: fm.slug ?? slugFromPath(path),
    date: formatDate(fm.date),
    datetime: buildDatetime(fm.date, fm.time),
    order: parseOrder(fm.order),
    tone: fm.tone ?? toneOf(fm.category),
    tags: fm.tags ?? [],
    wordCount,
    words: t(copy.common.words, { count: wordCount.toLocaleString('en-US') }),
    reading: readingOf(wordCount),
    toc: fm.toc ?? [],
    Component: mod.default,
    source: path,
  }
})

/** 按日期倒序 */
export const posts = raw
  .slice()
  .sort((a, b) => {
    /* 时间倒序；同日同刻按 slug 字母序兜底，保证顺序确定 */
    return b.datetime.localeCompare(a.datetime) || a.slug.localeCompare(b.slug)
  })

export const postCount = posts.length

/* ---------------- 派生：分类 ---------------- */

export const categories = (() => {
  const map = new Map()
  for (const p of posts) {
    if (!p.category) continue
    const entry = map.get(p.category) ?? { name: p.category, count: 0, tone: p.tone }
    entry.count += 1
    map.set(p.category, entry)
  }
  return [...map.values()].sort((a, b) => b.count - a.count)
})()

/* ---------------- 派生：标签 ---------------- */

export const tags = (() => {
  const map = new Map()
  for (const p of posts) {
    for (const t of p.tags ?? []) {
      map.set(t, (map.get(t) ?? 0) + 1)
    }
  }
  return [...map.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name))
})()

/* ---------------- 派生：归档 ---------------- */

/** 按年-月分组，年份倒序、月份倒序 */
export const archive = (() => {
  const byYear = new Map()
  for (const p of posts) {
    if (!p.datetime) continue
    const [y, m] = p.datetime.split('-')
    const year = byYear.get(y) ?? new Map()
    const month = year.get(m) ?? []
    month.push(p)
    year.set(m, month)
    byYear.set(y, year)
  }

  return [...byYear.entries()]
    .sort((a, b) => Number(b[0]) - Number(a[0]))
    .map(([year, months]) => ({
      year,
      months: [...months.entries()]
        .sort((a, b) => Number(b[0]) - Number(a[0]))
        .map(([m, list]) => ({
          month: t(copy.common.monthUnit, { month: Number(m) }),
          count: list.length,
          /* 签到图需要「日」，因此条目带上 day */
          posts: list.map((p) => ({
            title: p.title,
            slug: p.slug,
            day: Number(p.datetime.split('-')[2]),
          })),
          slugs: list.map((p) => p.slug),
        })),
    }))
})()

/* ---------------- 派生：上下文导航 ---------------- */

/** 按时间倒序的相邻关系：prev = 更早列表里更靠前的一篇，next = 更晚的一篇。
 *  标签文案由页面按 copy.common 渲染，数据层只给数据。 */
export function getNeighbours(slug, context) {
  /* 上下篇跟着进入语境走：分类页进入 → 同分类（继承 order 顺序，教程的
     上一篇就是学习路径的上一步）；标签页进入 → 同标签；
     首页 / 归档 / 直接打开 → 全站时间线。 */
  let list = posts
  if (context?.type === 'category' && context.name) list = postsByCategory(context.name)
  else if (context?.type === 'tag' && context.name) list = postsByTag(context.name)
  const idx = list.findIndex((p) => p.slug === slug)
  if (idx === -1) return { prev: null, next: null }
  return {
    prev: list[idx - 1] ? { title: list[idx - 1].title, slug: list[idx - 1].slug } : null,
    next: list[idx + 1] ? { title: list[idx + 1].title, slug: list[idx + 1].slug } : null,
  }
}

/** 首页精选：front matter 里 pinned 为 true 的第一篇 */
export const featured = (() => {
  const pinned = posts.find((p) => p.pinned)
  if (pinned) {
    return {
      slug: pinned.slug,
      title: pinned.title,
      summary: pinned.summary ?? '',
      image: pinned.image ?? null,
    }
  }
  return null
})()

/** 标签云：出现频次前 N 个 */
export const topTags = tags.slice(0, config.topTagsCloudCount)

export function postsByCategory(name) {
  /* 分类内顺序：写了 order 的按 order 升序排前面（教程 / 系列定阅读顺序）；
     没写的排后面，仍按时间倒序。全局列表与归档不受影响，
     分类页的「接着读」推荐继承这个顺序——下一篇就是学习路径里的下一篇。 */
  return posts
    .filter((p) => p.category === name)
    .sort((a, b) => {
      const ao = a.order
      const bo = b.order
      if (ao !== null && bo !== null) {
        if (ao !== bo) return ao - bo
        return a.slug.localeCompare(b.slug)
      }
      if (ao !== null) return -1
      if (bo !== null) return 1
      return b.datetime.localeCompare(a.datetime) || a.slug.localeCompare(b.slug)
    })
}

export function postsByTag(name) {
  return posts.filter((p) => (p.tags ?? []).includes(name))
}

export function getPost(slug) {
  return posts.find((p) => p.slug === slug) ?? null
}

/* ---------------- 派生：文章页右侧「接着读」 ---------------- */

/** 依据进入文章时的来源分组，给出同组的其它文章。
 *  context 形如 { type: 'category' | 'tag', name }，由列表页通过 Link state 传入。
 *  没有来源（首页 / 归档 / 直接打开）时先按本文分类兜底，
 *  分类里只剩自己时才退到「最近写的」，保证侧栏不空。 */
export function getRelatedPosts(post, context) {
  const limit = config.relatedLimit
  const others = (list) => list.filter((p) => p.slug !== post.slug).slice(0, limit)

  if (context?.type === 'tag' && context.name) {
    const all = postsByTag(context.name)
    if (others(all).length) {
      return { kind: 'tag', name: context.name, list: others(all), total: all.length }
    }
  }

  const category =
    context?.type === 'category' && context.name ? context.name : post.category
  if (category) {
    const all = postsByCategory(category)
    if (others(all).length) {
      return { kind: 'category', name: category, list: others(all), total: all.length }
    }
  }

  return { kind: 'recent', name: '', list: others(posts), total: postCount }
}
