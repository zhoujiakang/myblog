import { useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHead } from './shared/PageHead'
import { CalendarCard } from '../components/CalendarCard'
import { EmptyState } from '../components/EmptyState'
import { config, copy, t } from '../data/site'
import { archive } from '../lib/posts'

/* 归档页 —— 居中窄版式：
   桌面：左纵向时间线；右月份日历（可切换，默认最新月）+ 本年节奏面板。
   手机：时间线会随文章增长越拉越长，日历和节奏被压在页尾看不见，
   所以沿用关于页的 tab 模式收成一组切换（文章时间线 / 日历·节奏），
   两块始终在 DOM 里、显隐交给 CSS，桌面稿完全不受切换状态影响。 */

const TABS = [
  { key: 'timeline', label: copy.archive.tabTimeline },
  { key: 'side', label: copy.archive.tabSide },
]

export function ArchivePage() {
  /* 手机端 tab：默认文章时间线，日历·节奏一按就到。
     看日历通常是「瞄一眼再回来读」：切走时记住时间线位置，切回时还原。 */
  const [tab, setTab] = useState('timeline')
  const tabRefs = useRef({})
  const timelineY = useRef(0)

  const switchTab = (key) => {
    if (key === tab) return
    if (tab === 'timeline') timelineY.current = window.scrollY
    setTab(key)
    if (key === 'timeline') {
      /* 等时间线重新可见、文档高度恢复后再滚 */
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.scrollTo(0, timelineY.current)
          timelineY.current = 0
        })
      })
    }
  }

  /* 节奏卡数据：最新一个有文章的年份（当前年显示「本年节奏」） */
  const latestYear = archive[0]
  const isCurrentYear = Number(latestYear?.year) === new Date().getFullYear()

  const jumpToMonth = (year, month) => {
    /* 手机端节奏卡在「日历·节奏」tab 里，时间线不在视口（display:none），
       scrollIntoView 无效：先切回时间线 tab，等两帧渲染完成再定位 */
    setTab('timeline')
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document
          .getElementById(`timeline-month-${year}-${month}`)
          ?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      })
    })
  }

  const onTabKeyDown = (e, key) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const i = TABS.findIndex((p) => p.key === key)
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? TABS.length - 1
          : (i + (e.key === 'ArrowRight' ? 1 : -1) + TABS.length) % TABS.length
    const target = TABS[next].key
    switchTab(target)
    tabRefs.current[target]?.focus()
  }

  return (
    <div className="archive-shell">
      <PageHead title={copy.archive.title} desc={copy.archive.desc} />

      {/* 手机端切换（桌面 CSS 隐藏）：文章多了日历节奏也不会沉底 */}
      <div className="archive-tabs" role="tablist" aria-label={copy.archive.tabsLabel}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            ref={(el) => {
              tabRefs.current[key] = el
            }}
            type="button"
            role="tab"
            id={`archive-tab-${key}`}
            aria-controls={`archive-panel-${key}`}
            aria-selected={tab === key}
            tabIndex={tab === key ? 0 : -1}
            className={tab === key ? 'archive-tab archive-tab--active' : 'archive-tab'}
            onClick={() => switchTab(key)}
            onKeyDown={(e) => onTabKeyDown(e, key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="archive-columns" data-tab={tab}>
        {/* 左：纵向时间线 */}
        <div
          className="archive-main"
          id="archive-panel-timeline"
          role="tabpanel"
          aria-labelledby="archive-tab-timeline"
        >
          {archive.length === 0 ? <EmptyState text={copy.empty.archive} /> : null}
          {archive.map((year) => {
            const total = year.months.reduce((sum, m) => sum + m.count, 0)
            const activeMonths = year.months.filter((m) => m.count > 0).length
            return (
              <section className="archive-year" key={year.year}>
                <div className="archive-year-head">
                  <h2 className="archive-year-label">{year.year}</h2>
                  <span className="archive-year-note">
                    {t(copy.archive.yearNote, { count: total, months: activeMonths })}
                  </span>
                </div>
                <div className="archive-timeline">
                  {year.months.map((m) => (
                    <div
                      className="timeline-month"
                      key={m.month}
                      id={`timeline-month-${year.year}-${Number(m.month.split(' ')[0])}`}
                    >
                      <span
                        className={
                          m.count >= 2
                            ? 'timeline-node timeline-node--hot'
                            : 'timeline-node'
                        }
                        aria-hidden="true"
                      />
                      <div className="timeline-content">
                        <div className="timeline-month-head">
                          <span className="timeline-month-name">{m.month}</span>
                        </div>
                        <div className="timeline-posts">
                          {m.posts.map((post) => (
                            <Link
                              className="timeline-post"
                              key={post.slug}
                              to={`/posts/${post.slug}`}
                              state={{ nav: '/archive' }}
                            >
                              {post.title}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )
          })}
        </div>

        {/* 右：月份日历（可切换） + 本年节奏 */}
        <aside
          className="archive-side"
          id="archive-panel-side"
          role="tabpanel"
          aria-labelledby="archive-tab-side"
        >
          <CalendarCard archive={archive} />

          {/* 节奏卡：只列有文章的月份，条长直接等于篇数 × 单位长度 */}
          {latestYear && (
            <div className="side-card">
              <p className="archive-side-title">
                {isCurrentYear
                  ? copy.archive.sideTitleCurrent
                  : t(copy.archive.sideTitleOther, { year: latestYear.year })}
              </p>
              <div className="archive-side-bars">
                {latestYear.months.map((m) => (
                  <button
                    key={m.month}
                    type="button"
                    className="archive-bar-row"
                    title={t(copy.archive.barTitle, { month: m.month, count: m.count })}
                    onClick={() =>
                      jumpToMonth(latestYear.year, Number(m.month.split(' ')[0]))
                    }
                  >
                    <span className="archive-bar-label">{m.month}</span>
                    <span
                      className="archive-bar"
                      style={{ width: `${m.count * config.barUnitPx}px` }}
                    />
                  </button>
                ))}
              </div>
            </div>
          )}
        </aside>
      </div>
    </div>
  )
}
