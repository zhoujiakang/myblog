/* 「折腾记录」数据层 —— 与 posts.js 同一套管线：
   src/content/works/*.md 构建期编译成组件，front matter 派生列表。
   配色、状态顺序、字数换算都读 src/content/site/config.json。 */

import { config, copy, t } from '../data/site'

const modules = import.meta.glob('../content/works/*.md', { eager: true })

function slugFromPath(path) {
  return path.split('/').pop().replace(/\.md$/, '')
}

function formatDate(d) {
  const dt = new Date(d)
  if (Number.isNaN(dt.getTime())) return String(d ?? '')
  const p = (n) => String(n).padStart(2, '0')
  return `${dt.getFullYear()}.${p(dt.getMonth() + 1)}.${p(dt.getDate())}`
}

function isoDate(d) {
  const dt = new Date(d)
  return Number.isNaN(dt.getTime()) ? '' : dt.toISOString().slice(0, 10)
}

/** datetime = 日期 + 可选时间（frontmatter time: HH:mm），与 posts.js 同一规则 */
function buildDatetime(date, time) {
  const day = isoDate(date)
  if (!day) return ''
  const raw = String(time ?? '').trim()
  const t = /^([01]?\d|2[0-3]):[0-5]\d$/.test(raw) ? raw.padStart(5, '0') : '00:00'
  return `${day}T${t}:00`
}

/** 字数由 remark 插件统计原文得出；阅读时长按每分钟字数向上取整 */
function readingOf(wordCount) {
  const minutes = Math.max(1, Math.ceil((wordCount || 0) / config.wordsPerMinute))
  return t(copy.common.minutes, { count: minutes })
}

export const works = Object.entries(modules)
  .map(([path, mod]) => {
    const fm = mod.frontmatter ?? {}
    const wordCount = Number(fm.wordCount) || 0
    return {
      ...fm,
      slug: slugFromPath(path),
      date: formatDate(fm.date),
      datetime: buildDatetime(fm.date, fm.time),
      kind: fm.kind ?? config.defaults.kind,
      status: fm.status ?? config.defaults.status,
      kindTone: config.kindTones[fm.kind] ?? config.defaultTone,
      statusTone: config.statusTones[fm.status] ?? config.defaultTone,
      tags: fm.tags ?? [],
      link: fm.link ?? '',
      /* 与文章同一套：目录与字数由 remark 插件注入 front matter */
      toc: fm.toc ?? [],
      wordCount,
      words: t(copy.common.words, { count: wordCount.toLocaleString('en-US') }),
      reading: readingOf(wordCount),
      Component: mod.default,
      source: path,
    }
  })
  .sort((a, b) => {
    /* 未完成的排前面，同状态按时间倒序 */
    const aOrder = config.statusOrder[a.status] ?? 9
    const bOrder = config.statusOrder[b.status] ?? 9
    return (
      aOrder - bOrder ||
      b.datetime.localeCompare(a.datetime) ||
      a.slug.localeCompare(b.slug)
    )
  })

/* 首页「近期目标」= 接下来想做的；搞定的不再展示 */
export const activeWorks = works.filter((w) =>
  config.worksStatuses.planned.includes(w.status)
)
export const doneWorks = works.filter((w) => w.status === config.worksStatuses.done)

export function getWork(slug) {
  return works.find((w) => w.slug === slug) ?? null
}

/* 上下条导航 —— 与文章页同款语义：prev 更新、next 更旧 */
export function getNeighbours(slug) {
  const idx = works.findIndex((w) => w.slug === slug)
  if (idx === -1) return { prev: null, next: null }
  const newer = works[idx - 1]
  const older = works[idx + 1]
  return {
    prev: newer ? { title: newer.title, slug: newer.slug } : null,
    next: older ? { title: older.title, slug: older.slug } : null,
  }
}

export function worksByKind(kind) {
  return works.filter((w) => w.kind === kind)
}

/** 折腾详情页右侧「接着看」：优先同类型，没有就给最近几条。
 *  与文章页的 getRelatedPosts 同一套形态，侧栏因此可以共用样式。 */
export function getRelatedWorks(work) {
  const limit = config.relatedLimit
  const others = works.filter((w) => w.slug !== work.slug)
  const sameKind = others.filter((w) => w.kind === work.kind)
  if (sameKind.length) {
    return { kind: 'kind', name: work.kind, list: sameKind.slice(0, limit), total: sameKind.length }
  }
  return { kind: 'recent', name: '', list: others.slice(0, limit), total: works.length }
}
