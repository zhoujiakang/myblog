import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { asset, copy, site } from '../data/site'
import { SearchButton } from './SearchDialog'
import { useScrollLock } from '../hooks/useScrollLock'

/* 胶囊位置要在浏览器布局完成后测量，因此用 useLayoutEffect；
   但服务端渲染时它不执行，改用 useEffect 以免 React 报警告。
   本项目是纯客户端应用，实际生效的仍是 layout 阶段。 */
const useIsomorphicLayoutEffect =
  typeof window !== 'undefined' ? useLayoutEffect : useEffect

const NAV = copy.nav.items

/** 激活判定。
 *  「首页」要求精确匹配 /，否则 startsWith 会把所有路径都算成首页；
 *  其余栏目按前缀匹配。
 *  文章页（/posts 与 /posts/xxx）没有自己的导航项：
 *  从哪个分组页点进来（Link 的 state.nav），就高亮那个分组页；
 *  直接输入网址进来则不高亮任何项。 */
function useActive() {
  const { pathname, state } = useLocation()
  return (item) => {
    if (pathname === '/posts' || pathname.startsWith('/posts/')) {
      const from = state?.nav
      if (!from) return false
      /* 文章没有自己的导航项。首页进入时文章在语境上属于归档，
         顶部高亮归档一栏；其余入口高亮来源分组。 */
      const effective = from === '/' ? '/archive' : from
      return effective === item.to || effective.startsWith(item.to + '/')
    }
    if (item.to === '/') return pathname === '/'
    return pathname === item.to || pathname.startsWith(item.to + '/')
  }
}

/**
 * 滑动的激活胶囊：绝对定位的独立图层，靠 transform 平移到激活项上，
 * 文字另有一层，切换时只有胶囊在动，导航宽度不会跳。
 */
function usePill(items, activeIndex) {
  const [pos, setPos] = useState(null)
  const listRef = useRef(null)
  const itemRefs = useRef([])

  useIsomorphicLayoutEffect(() => {
    const measure = () => {
      const el = itemRefs.current[activeIndex]
      const nav = listRef.current
      /* 没有激活项（如文章页无来源、404）时把胶囊收起 */
      if (!el || !nav) {
        setPos(null)
        return
      }
      const navRect = nav.getBoundingClientRect()
      const itemRect = el.getBoundingClientRect()
      setPos({ left: itemRect.left - navRect.left, width: itemRect.width })
    }
    measure()

    if (document.fonts?.ready) {
      document.fonts.ready.then(measure).catch(() => {})
    }

    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [activeIndex, items.length])

  return { pos, listRef, itemRefs }
}

function Brand({ small = false }) {
  return (
    <Link className="brand" to="/">
      <span className={small ? 'brand-avatar brand-avatar--sm' : 'brand-avatar'}>
        <img src={asset(site.avatar)} alt={site.avatarAlt} />
      </span>
      <span className="brand-name display">{site.name}</span>
    </Link>
  )
}

export default function Header() {
  const isActive = useActive()
  const activeIndex = NAV.findIndex(isActive)
  const { pos, listRef, itemRefs } = usePill(NAV, activeIndex)

  return (
    <header className="site-header">
      <Brand />

      <nav
        className="nav"
        aria-label={copy.nav.ariaLabel}
        ref={listRef}
        data-pill-ready={pos ? 'true' : 'false'}
      >
        <span
          className="nav-pill"
          aria-hidden="true"
          style={
            pos
              ? { transform: `translateX(${pos.left}px)`, width: `${pos.width}px` }
              : { opacity: 0 }
          }
        />
        {NAV.map((item, i) => {
          const active = i === activeIndex
          return (
            <Link
              key={item.to}
              to={item.to}
              ref={(el) => {
                itemRefs.current[i] = el
              }}
              className={active ? 'nav-item nav-item--active' : 'nav-item'}
              aria-current={active ? 'page' : undefined}
            >
              {item.label}
            </Link>
          )
        })}
      </nav>

      <div className="header-right">
        <SearchButton />
      </div>
    </header>
  )
}

/** 手机页头：搜索 + 展开式菜单。
 *  菜单在路由变化 / 点击遮罩 / Esc / 再次点按钮时收起，
 *  展开时页头 sticky 吸顶，滚动中也不会把菜单带出视口。 */
export function MobileHeader() {
  const [open, setOpen] = useState(false)
  const { pathname } = useLocation()
  const isActive = useActive()

  /* 菜单展开时锁背景滚动 */
  useScrollLock(open)

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  /* 与搜索浮层、文章目录保持一致：Esc 收起 */
  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <header className="site-header site-header--mobile">
      <Brand small />

      <div className="mobile-header-right">
        <SearchButton className="search-pill search-pill--sm" short />
        <button
          type="button"
          className={open ? 'menu-toggle menu-toggle--open' : 'menu-toggle'}
          aria-label={copy.nav.menuAria}
          aria-expanded={open}
          aria-controls="mobile-nav"
          onClick={() => setOpen((v) => !v)}
        >
          <span>{open ? copy.nav.menuClose : copy.nav.menuOpen}</span>
          <span className="menu-toggle-icon" aria-hidden="true">
            {open ? '×' : '☰'}
          </span>
        </button>
      </div>

      {open ? (
        <>
          <div className="mobile-nav-backdrop" onClick={() => setOpen(false)} />
          <nav id="mobile-nav" className="mobile-nav" aria-label={copy.nav.mobileAriaLabel}>
            {NAV.map((item) => {
              const active = isActive(item)
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={active ? 'mobile-nav-item mobile-nav-item--active' : 'mobile-nav-item'}
                  aria-current={active ? 'page' : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              )
            })}
          </nav>
        </>
      ) : null}
    </header>
  )
}
