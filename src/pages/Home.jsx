import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ContactCard, Pill, SectionTitle } from '../components/Blocks'
import { asset, config, copy, site, t } from '../data/site'
import { categories, featured, posts, postCount } from '../lib/posts'
import { activeWorks } from '../lib/works'

/* 画布 D1（桌面）与 D3（手机）是两份不同的构图，不只是缩放，
   因此这里按两份稿子各自渲染完整的一棵树。
   所有文字都在 copy.json / profile.json，数量上限在 config.json。 */

const recent = posts.slice(0, config.recentHomeCount)

const CARD_GAP = 20
const DRAG_THRESHOLD = 6

/* 近期目标 = 折腾记录里「在搞 / 想做」的条目（src/lib/works.js 派生）。 */
function GoalList() {
  return (
    <div className="goal-list">
      {activeWorks.length === 0 ? (
        <div className="goal-item">
          <span className="goal-text">{copy.home.goalsEmpty}</span>
        </div>
      ) : (
        activeWorks.map((work) => (
          <Link key={work.slug} to={`/works/${work.slug}`} className="goal-item">
            <span className="goal-check" aria-hidden="true" />
            <Pill tone={work.kindTone} size="sm">
              {work.kind}
            </Pill>
            <span className="goal-text">{work.title}</span>
          </Link>
        ))
      )}
    </div>
  )
}

/* 桌面端文章卡行：不显示滚动条，鼠标按住拖拽 / 箭头切换 */
function RecentRow() {
  const rowRef = useRef(null)
  const drag = useRef({ active: false, moved: false, startX: 0, startLeft: 0 })
  const [edges, setEdges] = useState({ left: false, right: true })

  const syncEdges = () => {
    const row = rowRef.current
    if (!row) return
    setEdges({
      left: row.scrollLeft > 4,
      right: row.scrollLeft < row.scrollWidth - row.clientWidth - 4,
    })
  }

  useEffect(() => {
    syncEdges()
    window.addEventListener('resize', syncEdges)
    return () => window.removeEventListener('resize', syncEdges)
  }, [])

  const slide = (dir) => {
    const row = rowRef.current
    if (!row) return
    const card = row.querySelector('.post-card')
    const step = (card ? card.offsetWidth : 384) + CARD_GAP
    row.scrollBy({ left: dir * step, behavior: 'smooth' })
  }

  const onPointerDown = (e) => {
    if (e.pointerType !== 'mouse' || e.button !== 0) return
    drag.current = {
      active: true,
      moved: false,
      startX: e.clientX,
      startLeft: rowRef.current?.scrollLeft ?? 0,
    }
  }

  const onPointerMove = (e) => {
    const d = drag.current
    if (!d.active) return
    const dx = e.clientX - d.startX
    if (!d.moved && Math.abs(dx) > DRAG_THRESHOLD) d.moved = true
    if (d.moved && rowRef.current) rowRef.current.scrollLeft = d.startLeft - dx
  }

  const endDrag = () => {
    drag.current.active = false
  }

  const onClickCapture = (e) => {
    if (drag.current.moved) {
      e.preventDefault()
      e.stopPropagation()
      drag.current.moved = false
    }
  }

  /* 空内容时整块不渲染（hooks 已全部执行完，可安全返回） */
  if (!recent.length) return null

  return (
    <>
      <div className="section-row">
        <SectionTitle dot="blue" title={copy.home.recentTitle} />
        <div className="row-nav">
          <span className="section-note">{copy.home.recentNote}</span>
          <button
            type="button"
            className="row-arrow"
            aria-label={copy.home.arrowPrev}
            disabled={!edges.left}
            onClick={() => slide(-1)}
          >
            ←
          </button>
          <button
            type="button"
            className="row-arrow"
            aria-label={copy.home.arrowNext}
            disabled={!edges.right}
            onClick={() => slide(1)}
          >
            →
          </button>
          <Link className="section-note row-all" to="/posts">
            {copy.common.all}
          </Link>
        </div>
      </div>

      <div
        className="post-grid"
        ref={rowRef}
        onScroll={syncEdges}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onClickCapture={onClickCapture}
      >
        {recent.map((post) => (
          <Link key={post.slug} to={`/posts/${post.slug}`} state={{ nav: '/' }} className="post-card">
            <Pill tone={post.tone} size="sm">
              {post.category}
            </Pill>
            <h3 className="post-card-title">{post.title}</h3>
            <p className="post-card-summary">{post.summary}</p>
            <p className="post-card-meta">
              {post.date} · {post.reading}
            </p>
          </Link>
        ))}
      </div>
    </>
  )
}

function HeroArt() {
  return (
    <div className="hero-art" style={{ backgroundImage: `url(${asset(site.heroArt)})` }} />
  )
}

function HeroButtons() {
  return (
    <div className="hero-actions">
      <Link className="btn btn--primary" to="/posts">
        {copy.home.heroPrimary}
      </Link>
      <Link className="btn btn--ghost" to="/about">
        {copy.home.heroSecondary}
      </Link>
    </div>
  )
}

/* ===================== 桌面（画布 D1） ===================== */

function DesktopHome() {
  return (
    <div className="only-desktop">
      <section className="hero">
        <div className="hero-left">
          <div className="hello">
            <span className="hello-text">{site.greeting}</span>
          </div>
          <h1 className="hero-title">{site.heroTitle}</h1>
          <p className="hero-intro">{site.intro}</p>
          <HeroButtons />
        </div>
        <HeroArt />
      </section>

      {featured ? (
        <section className="featured">
          <Link className="featured-card" to={`/posts/${featured.slug}`} state={{ nav: '/' }}>
            <div
              className="featured-image"
              style={{ backgroundImage: `url(${asset(site.featuredArt)})` }}
            />
            <div className="featured-body">
              <span className="pill pill--yellow">{copy.home.featuredBadge}</span>
              <h2 className="featured-title">{featured.title}</h2>
              <p className="featured-summary">{featured.summary}</p>
              <span className="featured-link">{copy.home.featuredLink}</span>
            </div>
          </Link>
        </section>
      ) : null}

      <RecentRow />

      {categories.length > 0 ? (
        <section className="section-block">
          <SectionTitle
            dot="mint"
            title={copy.home.categoriesTitle}
            note={t(copy.home.categoriesNote, { categories: categories.length, posts: postCount })}
          />
          <div className="cat-pill-row">
            {categories.map((c) => (
              <Pill key={c.name} tone={c.tone} to={`/categories/${c.name}`}>
                {c.name} {c.count}
              </Pill>
            ))}
          </div>
        </section>
      ) : null}

      <section className="section-block section-block--tight">
        <div className="section-title-row">
          <div className="section-title-left">
            <span className="section-dot section-dot--yellow" />
            <h2 className="section-title display">{copy.home.goalsTitle}</h2>
          </div>
          <span className="section-note">
            {t(copy.home.goalsNote, { count: activeWorks.length })}
            <Link to="/works"> {copy.common.all}</Link>
          </span>
        </div>
        <GoalList />
      </section>

      <section className="contact-wrap">
        <ContactCard />
      </section>
    </div>
  )
}

/* ===================== 手机（画布 D3） ===================== */

function MobileHome() {
  return (
    <div className="only-mobile">
      <section className="hero hero--mobile">
        <div className="hero-left">
          <div className="hello">
            <span className="hello-text">{site.greeting}</span>
          </div>
          <h1 className="hero-title">{site.heroTitle}</h1>
          <p className="hero-intro">{site.introMobile}</p>
        </div>
        <HeroArt />
        <HeroButtons />
      </section>

      {/* 手机端也给一张精简的置顶卡（不放大插画），内容与桌面同源 */}
      {featured ? (
        <section className="featured featured--mobile">
          <Link
            className="featured-card featured-card--mobile"
            to={`/posts/${featured.slug}`}
            state={{ nav: '/' }}
          >
            <span className="pill pill--yellow">{copy.home.featuredBadge}</span>
            <h2 className="featured-title featured-title--mobile">{featured.title}</h2>
            <p className="featured-summary featured-summary--mobile">{featured.summary}</p>
            <span className="featured-link">{copy.home.featuredLink}</span>
          </Link>
        </section>
      ) : null}

      {recent.length > 0 ? (
        <>
          <div className="section-row">
            <SectionTitle dot="blue" title={copy.home.recentTitle} note={copy.common.all} noteTo="/posts" />
          </div>

          <div className="post-grid">
            {recent.slice(0, config.recentMobileCount).map((post) => (
              <Link key={post.slug} to={`/posts/${post.slug}`} state={{ nav: '/' }} className="post-card">
                <Pill tone={post.tone} size="sm">
                  {post.category}
                </Pill>
                <h3 className="post-card-title">{post.title}</h3>
                <p className="post-card-meta">
                  {post.date} · {post.reading}
                </p>
              </Link>
            ))}
          </div>
        </>
      ) : null}

      {categories.length > 0 ? (
        <>
          <div className="section-row section-row--cats">
            <SectionTitle
              dot="mint"
              title={copy.home.categoriesTitle}
              note={t(copy.home.categoriesNoteMobile, { categories: categories.length })}
            />
          </div>

          <div className="cat-pill-row cat-pill-row--block">
            {categories.slice(0, config.categoriesMobileCount).map((c) => (
              <Pill key={c.name} tone={c.tone} to={`/categories/${c.name}`}>
                {c.name} {c.count}
              </Pill>
            ))}
          </div>
        </>
      ) : null}

      <section className="section-block section-block--tight">
        <div className="section-title-row">
          <div className="section-title-left">
            <span className="section-dot section-dot--yellow" />
            <h2 className="section-title display">{copy.home.goalsTitle}</h2>
          </div>
        </div>
        <GoalList />
      </section>

      <section className="contact-wrap">
        <ContactCard mobile />
      </section>
    </div>
  )
}

export function Home() {
  return (
    <>
      <DesktopHome />
      <MobileHome />
    </>
  )
}
