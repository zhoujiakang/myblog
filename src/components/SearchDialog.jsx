import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { copy, t } from '../data/site'
import { posts } from '../lib/posts'
import { works } from '../lib/works'
import { useScrollLock } from '../hooks/useScrollLock'

/* 站内搜索：全部在本地内存里做，不引依赖、不发请求。
   数据来自与列表页同一份派生结果，所以新写的 md 会自动被搜到。 */
const INDEX = [
  ...posts.map((p) => ({
    key: `post-${p.slug}`,
    kind: 'post',
    title: p.title,
    summary: p.summary ?? '',
    tags: p.tags ?? [],
    category: p.category ?? '',
    date: p.date,
    to: `/posts/${p.slug}`,
  })),
  ...works.map((w) => ({
    key: `work-${w.slug}`,
    kind: 'work',
    title: w.title,
    summary: w.summary ?? '',
    tags: w.tags ?? [],
    category: w.kind ?? '',
    date: w.date,
    to: `/works/${w.slug}`,
  })),
]

function matches(item, keyword) {
  return `${item.title} ${item.summary} ${item.tags.join(' ')} ${item.category}`
    .toLowerCase()
    .includes(keyword)
}

/* 桌面页头与手机页头是同时挂载的（靠 CSS 切换显隐），
   若各自维护一份 open 状态，⌘K 会同时弹出两个浮层。
   因此状态提到 Layout 里，用 context 共享，浮层全局只渲染一次。 */
const SearchContext = createContext(null)

export function SearchProvider({ children }) {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setOpen((v) => !v)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  return (
    <SearchContext.Provider value={{ open, setOpen }}>
      {children}
      {open ? <SearchDialog onClose={() => setOpen(false)} /> : null}
    </SearchContext.Provider>
  )
}

export function SearchButton({ className = 'search-pill', short = false }) {
  const ctx = useContext(SearchContext)
  return (
    <button
      type="button"
      className={className}
      aria-label={copy.search.buttonAria}
      aria-haspopup="dialog"
      onClick={() => ctx?.setOpen(true)}
    >
      {short ? copy.search.buttonShort : copy.search.button}
    </button>
  )
}

function SearchDialog({ onClose }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)
  const navigate = useNavigate()

  /* 浮层开着时锁住背景滚动，关闭后回到原来的位置 */
  useScrollLock(true)

  useEffect(() => {
    inputRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [onClose])

  const keyword = query.trim().toLowerCase()
  const results = useMemo(
    () => (keyword ? INDEX.filter((item) => matches(item, keyword)).slice(0, 12) : []),
    [keyword]
  )

  /* 跳转后把焦点移到文章 / 折腾标题上：屏幕阅读器和键盘用户
     能立刻感知「已经换到新页面」，而不是停在看不见的旧浮层位置 */
  const focusTargetHeading = () => {
    requestAnimationFrame(() => {
      const heading = document.querySelector('main h1')
      if (heading) {
        heading.setAttribute('tabindex', '-1')
        heading.focus({ preventScroll: true })
      }
    })
  }

  const onEnter = (e) => {
    if (e.key === 'Enter' && results.length) {
      e.preventDefault()
      navigate(results[0].to)
      onClose()
      focusTargetHeading()
    }
  }

  return (
    <div
      className="search-overlay"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose()
      }}
    >
      <div className="search-dialog" role="dialog" aria-modal="true" aria-label={copy.search.title}>
        <div className="search-head">
          <p className="search-title display">{copy.search.title}</p>
          <button type="button" className="search-close" aria-label={copy.search.closeAria} onClick={onClose}>
            {copy.search.close}
          </button>
        </div>
        <input
          ref={inputRef}
          className="search-input"
          type="search"
          value={query}
          placeholder={copy.search.placeholder}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={onEnter}
        />
        <p className="search-meta">
          {keyword ? t(copy.search.count, { count: results.length }) : copy.search.hint}
        </p>
        <div className="search-results">
          {keyword && !results.length ? (
            <p className="search-empty">{copy.search.empty}</p>
          ) : (
            results.map((item) => (
              <Link
                key={item.key}
                className="search-result"
                to={item.to}
                onClick={() => {
                  onClose()
                  focusTargetHeading()
                }}
              >
                <span className="search-result-kind">
                  {item.kind === 'post' ? copy.search.groupPosts : copy.search.groupWorks}
                </span>
                <span className="search-result-title">{item.title}</span>
                <span className="search-result-date">{item.date}</span>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
