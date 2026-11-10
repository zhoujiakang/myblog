import { useMemo } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArticleRail } from '../components/ArticleRail'
import { BackLink } from '../components/BackLink'
import { Pill } from '../components/Blocks'
import { copy, t } from '../data/site'
import { useTocHighlight } from '../hooks/useTocHighlight'
import { getNeighbours, getPost, getRelatedPosts } from '../lib/posts'

export function Article() {
  const { slug } = useParams()
  const { state } = useLocation()
  const post = useMemo(() => getPost(slug), [slug])

  /* 上下篇 / 右侧推荐里连着点，来源上下文要一路带走：
     nav 决定顶部高亮，context 决定右侧推荐哪一组文章。 */
  const carryState = state && Object.keys(state).length ? state : undefined

  const [activeToc, setActiveToc] = useTocHighlight(post?.toc?.length ?? 0, slug)

  if (!post) {
    return (
      <div className="page-body-empty">
        <p>{copy.article.notFound}</p>
        <Link className="btn btn--primary" to="/posts">
          {copy.article.notFoundButton}
        </Link>
      </div>
    )
  }

  const toc = post.toc ?? []
  /* 上一篇 / 下一篇跟随进入语境：分类页进入只在该分类里翻，标签页同理 */
  const { prev, next } = getNeighbours(post.slug, state?.context)
  const Body = post.Component

  /* 手机工具条里的返回：从分类 / 标签进来就退回那一组，
     其余入口（首页、归档、直接打开）退回文章列表。 */
  const back = (() => {
    const ctx = state?.context
    if (ctx?.type === 'category' && ctx.name) {
      return {
        to: `/categories/${encodeURIComponent(ctx.name)}`,
        label: t(copy.article.backCategory, { name: ctx.name }),
      }
    }
    if (ctx?.type === 'tag' && ctx.name) {
      return {
        to: `/tags/${encodeURIComponent(ctx.name)}`,
        label: t(copy.article.backTag, { name: ctx.name }),
      }
    }
    return { to: '/posts', label: copy.article.backPosts }
  })()

  /* 桌面侧栏目录与手机工具条目录共用一套跳转，避免两处各写一遍 */
  const jumpTo = (i) => {
    setActiveToc(i)
    document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  /* 右侧第二块：从分类页进来 → 同分类其它文章；从标签页进来 → 同标签其它文章。
     其它入口按本文分类兜底，实在没有就给最近写的。 */
  const related = getRelatedPosts(post, state?.context)
  const relatedTitle =
    related.kind === 'tag'
      ? t(copy.article.relatedTag, { name: related.name })
      : related.kind === 'category'
        ? t(copy.article.relatedCategory, { name: related.name })
        : copy.article.relatedRecent
  const relatedAll =
    related.kind === 'tag'
      ? {
          to: `/tags/${encodeURIComponent(related.name)}`,
          label: t(copy.article.relatedAll, { count: related.total }),
        }
      : related.kind === 'category'
        ? {
            to: `/categories/${encodeURIComponent(related.name)}`,
            label: t(copy.article.relatedAll, { count: related.total }),
          }
        : { to: '/posts', label: copy.article.relatedAllPosts }

  return (
    <>
      {/* 工具条 + 文章头 + 正文包在一层里：吸顶只覆盖正文范围，
          滚到「接着读 / 上下篇」时工具条自然让位。 */}
      <div className="article-shell">
        <ArticleRail
          back={back}
          toc={toc}
          active={activeToc}
          onJump={jumpTo}
          label={copy.article.tocTitle}
          resetKey={post.slug}
        />

        {/* ---------- 文章头 ---------- */}
        <header className="article-head">
          <div className="article-tag-row">
            <Pill tone={post.tone} size="sm">
              {post.category}
            </Pill>
            {(post.tags ?? []).map((t) => (
              <Pill key={t} size="sm">
                {t}
              </Pill>
            ))}
          </div>
          <h1 className="article-title">{post.title}</h1>
          <p className="article-meta">
            <time dateTime={post.datetime}>{post.date}</time>
            {t(copy.article.meta, { reading: post.reading, words: post.words })}
          </p>
        </header>

        {/* ---------- 正文 + 右侧栏（目录 / 接着读） ---------- */}
        <div className="article-body-wrap">
          <article className="article-body">
            <Body />
          </article>

          <aside className="article-side" aria-label={copy.article.sideLabel}>
            {toc.length ? (
              <nav className="toc" aria-label={copy.article.tocTitle}>
                <p className="toc-title">{copy.article.tocTitle}</p>
                {toc.map((item, i) => (
                  <a
                    key={item}
                    className={i === activeToc ? 'toc-link toc-link--active' : 'toc-link'}
                    href={`#section-${i}`}
                    onClick={(e) => {
                      /* HashRouter 下 hash 是路由本身，放行原生锚点会落进 404 */
                      e.preventDefault()
                      jumpTo(i)
                    }}
                  >
                    {item}
                  </a>
                ))}
              </nav>
            ) : null}

            {related.list.length ? (
              <section className="side-related">
                <p className="side-related-title">{relatedTitle}</p>
                <ul className="side-related-list">
                  {related.list.map((p) => (
                    <li key={p.slug}>
                      <Link
                        className="side-related-item"
                        to={`/posts/${p.slug}`}
                        state={carryState}
                      >
                        <span className="side-related-name">{p.title}</span>
                        <span className="side-related-date">{p.date}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link className="side-related-all" to={relatedAll.to}>
                  {relatedAll.label}{copy.common.arrow}
                </Link>
              </section>
            ) : null}
          </aside>
        </div>
      </div>

      {/* ---------- 上下篇 ---------- */}
      <div className="prev-next">
        {prev ? (
          <Link className="prev-next-card" to={`/posts/${prev.slug}`} state={carryState}>
            <span className="prev-next-label">{copy.common.prevPost}</span>
            <span className="prev-next-title">{prev.title}</span>
          </Link>
        ) : null}
        {next ? (
          <Link className="prev-next-card" to={`/posts/${next.slug}`} state={carryState}>
            <span className="prev-next-label">{copy.common.nextPost}</span>
            <span className="prev-next-title">{next.title}</span>
          </Link>
        ) : null}
        {/* 与折腾详情页保持同一套底部导航；<=1100px 由顶部工具条接管，见 CSS */}
        {/* 历史栈里有上一页时走真正的后退：列表页恢复到离开时的位置 */}
        <BackLink className="prev-next-card prev-next-card--back" to="/posts" state={carryState}>
          <span className="prev-next-label">{copy.article.backLabel}</span>
          <span className="prev-next-title">{copy.article.backTitle}</span>
        </BackLink>
      </div>
    </>
  )
}
