import { Link } from 'react-router-dom'
import { Pill } from '../../components/Blocks'

/* 文章列表卡 —— 原来在 PostsPage 与 CategoryDetail 里各写了一份，
   标记相同、只有 meta 行不同，这里抽成一处。

   meta 接受字符串或数组：
   - 数组  -> 以「#标签」形式拼接（文章列表页的样式）
   - 字符串 -> 原样显示（如「2026.11.02 · 12 分钟」） */

export function ListCard({ post, meta, nav, context }) {
  const metaText = Array.isArray(meta)
    ? meta.map((t) => `#${t}`).join(' ')
    : meta

  /* nav 决定顶部高亮，context 决定文章页右侧推荐哪一组文章。
     两者一起透传，从分组页连着点几篇也不会丢上下文。 */
  const state =
    nav || context
      ? { ...(nav ? { nav } : {}), ...(context ? { context } : {}) }
      : undefined

  return (
    <Link className="list-card" to={`/posts/${post.slug}`} state={state}>
      <div className="list-card-main">
        <Pill tone={post.tone} size="sm">
          {post.category}
        </Pill>
        <h2 className="list-card-title">{post.title}</h2>
        <p className="list-card-summary">{post.summary}</p>
        <p className="list-card-meta">{metaText}</p>
      </div>
      <span className="list-card-date">{post.date}</span>
    </Link>
  )
}

/** 列表行 —— list-wrap 里的一行，包一层 list-row */
export function ListRow({ children }) {
  return <div className="list-row">{children}</div>
}
