import { useMemo } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import { ArticleRail } from '../components/ArticleRail'
import { BackLink } from '../components/BackLink'
import { Pill } from '../components/Blocks'
import { copy, t } from '../data/site'
import { useTocHighlight } from '../hooks/useTocHighlight'
import { getNeighbours, getRelatedWorks, getWork } from '../lib/works'

/* 折腾详情页 —— 与文章详情页完全同一套形态：
   目录吸附右侧并跟随滚动高亮、右侧「接着看」、上下条导航。 */
export function WorkDetail() {
  const { slug } = useParams()
  const { state } = useLocation()
  const work = useMemo(() => getWork(slug), [slug])

  /* 上下条跳转时透传来源，导航高亮不丢 */
  const carryState = state && Object.keys(state).length ? state : undefined
  const [activeToc, setActiveToc] = useTocHighlight(work?.toc?.length ?? 0, slug)

  if (!work) {
    return (
      <div className="page-body-empty">
        <p>{copy.workDetail.notFound}</p>
        <Link className="btn btn--primary" to="/works">
          {copy.workDetail.notFoundButton}
        </Link>
      </div>
    )
  }

  const toc = work.toc ?? []
  const { prev, next } = getNeighbours(work.slug)
  const Body = work.Component

  const back = { to: '/works', label: copy.workDetail.backWorks }

  /* 桌面侧栏目录与手机工具条目录共用一套跳转 */
  const jumpTo = (i) => {
    setActiveToc(i)
    document.getElementById(`section-${i}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  const related = getRelatedWorks(work)
  const relatedTitle =
    related.kind === 'kind'
      ? t(copy.workDetail.relatedKind, { name: related.name })
      : copy.workDetail.relatedRecent
  const relatedAllLabel =
    related.kind === 'kind'
      ? t(copy.workDetail.relatedAll, { count: related.total })
      : copy.workDetail.relatedAllWorks

  return (
    <>
      {/* 工具条 + 头部 + 正文包在一层里，吸顶范围只到正文末尾 */}
      <div className="article-shell">
        <ArticleRail
          back={back}
          toc={toc}
          active={activeToc}
          onJump={jumpTo}
          label={copy.workDetail.tocTitle}
          resetKey={work.slug}
        />

        {/* ---------- 头部 ---------- */}
        <header className="article-head">
          <div className="article-tag-row">
            <Pill tone={work.kindTone} size="sm">
              {work.kind}
            </Pill>
            <Pill tone={work.statusTone} size="sm">
              {work.status}
            </Pill>
            {(work.tags ?? []).map((t) => (
              <Pill key={t} size="sm">
                {t}
              </Pill>
            ))}
          </div>
          <h1 className="article-title">{work.title}</h1>
          <p className="article-meta">
            <time dateTime={work.datetime}>{work.date}</time>
            {t(copy.workDetail.meta, { reading: work.reading })}
            {work.wordCount ? t(copy.workDetail.metaWords, { words: work.words }) : ''}
            {work.link ? (
              <>
                {copy.workDetail.metaLinkPrefix}<a href={work.link} target="_blank" rel="noreferrer">
                  {copy.workDetail.metaLink}
                </a>
              </>
            ) : null}
          </p>
        </header>

        {/* ---------- 正文 + 右侧栏 ---------- */}
        <div className="article-body-wrap">
          <article className="article-body">
            <Body />
          </article>

          <aside className="article-side" aria-label={copy.workDetail.sideLabel}>
            {toc.length ? (
              <nav className="toc" aria-label={copy.workDetail.tocTitle}>
                <p className="toc-title">{copy.workDetail.tocTitle}</p>
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
                  {related.list.map((w) => (
                    <li key={w.slug}>
                      <Link
                        className="side-related-item"
                        to={`/works/${w.slug}`}
                        state={carryState}
                      >
                        <span className="side-related-name">{w.title}</span>
                        <span className="side-related-date">{w.date}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
                <Link className="side-related-all" to="/works">
                  {relatedAllLabel}{copy.common.arrow}
                </Link>
              </section>
            ) : null}
          </aside>
        </div>
      </div>

      {/* ---------- 上下条 ---------- */}
      <div className="prev-next">
        {prev ? (
          <Link className="prev-next-card" to={`/works/${prev.slug}`} state={carryState}>
            <span className="prev-next-label">{copy.common.prevWork}</span>
            <span className="prev-next-title">{prev.title}</span>
          </Link>
        ) : null}
        {next ? (
          <Link className="prev-next-card" to={`/works/${next.slug}`} state={carryState}>
            <span className="prev-next-label">{copy.common.nextWork}</span>
            <span className="prev-next-title">{next.title}</span>
          </Link>
        ) : null}
        <BackLink className="prev-next-card prev-next-card--back" to="/works" state={carryState}>
          <span className="prev-next-label">{copy.workDetail.backLabel}</span>
          <span className="prev-next-title">{copy.workDetail.backTitle}</span>
        </BackLink>
      </div>
    </>
  )
}
