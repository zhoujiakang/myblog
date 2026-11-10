import { useEffect, useRef } from 'react'
import { Outlet, Route, Routes, useLocation, useNavigationType, useParams } from 'react-router-dom'
import Header, { MobileHeader } from './components/Header'
import Footer from './components/Footer'
import { SearchProvider } from './components/SearchDialog'
import { Home } from './pages/Home'
import { Article } from './pages/Article'
import { PostsPage } from './pages/PostsPage'
import { WorksPage } from './pages/WorksPage'
import { WorkDetail } from './pages/WorkDetail'
import { CategoriesPage } from './pages/CategoriesPage'
import { CategoryDetail } from './pages/CategoryDetail'
import { TagsPage } from './pages/TagsPage'
import { ArchivePage } from './pages/ArchivePage'
import { AboutPage } from './pages/AboutPage'
import { NotFound } from './pages/NotFound'
import { postsByTag } from './lib/posts'
import { copy, t } from './data/site'

/* 滚动管理器：
   - 前进（点导航 / 列表进详情）：滚回顶部；
   - 后退（浏览器返回、站内「返回」走 navigate(-1)）：恢复离开时的位置。
   滚动位置按 pathname 存 sessionStorage——按 key 存虽然更精确，
   但返回类链接经由 navigate(-1) 走 POP，key 与离开时一致，pathname 更直观，
   且重复访问同一列表时取最近一次位置，符合「回到刚才在看的地方」的直觉。 */
function ScrollManager() {
  const location = useLocation()
  const navType = useNavigationType()
  const pathname = location.pathname

  /* 当前页面滚动时持续记录（rAF 节流），卸载时补一次 */
  useEffect(() => {
    let raf = 0
    const save = () => {
      try {
        sessionStorage.setItem(`scroll:${pathname}`, String(Math.round(window.scrollY)))
      } catch {
        /* 隐私模式等存储不可用时静默降级为不恢复 */
      }
    }
    const onScroll = () => {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(save)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      cancelAnimationFrame(raf)
      save()
    }
  }, [pathname])

  /* 路由变化后（下一帧，等新页面渲染完成）执行回顶或恢复 */
  useEffect(() => {
    if (navType === 'POP') {
      let saved = '0'
      try {
        saved = sessionStorage.getItem(`scroll:${pathname}`) ?? '0'
      } catch {
        /* 同上 */
      }
      requestAnimationFrame(() => window.scrollTo(0, Number(saved) || 0))
    } else {
      window.scrollTo(0, 0)
    }
  }, [pathname, navType])

  return null
}

/* 画布里页头在每页顶部都是同一套：桌面为品牌 + 导航 + 搜索胶囊，
   手机为品牌 + 「菜单」。统一放在布局里，路由用嵌套结构共享，
   新增页面只需要往下面的 <Route element={<Layout />}> 里加一行。 */
function Layout() {
  return (
    <SearchProvider>
      {/* 全站居中容器：超宽屏下页头 / 正文 / 页脚共用同一条内容边界，
          不会被拉成 1900px 的超长横条。它本身不是滚动容器，
          不影响内部 sticky 的页头与文章工具条。 */}
      <div className="site-frame">
        <Header />
        <MobileHeader />
        <main className="page-body">
          <Outlet />
        </main>
        <Footer />
      </div>
    </SearchProvider>
  )
}

function CategoryRoute() {
  const { name } = useParams()
  return <CategoryDetail name={decodeURIComponent(name ?? '')} />
}

function TagRoute() {
  const { name } = useParams()
  const tag = decodeURIComponent(name ?? '')
  const list = postsByTag(tag)
  return (
    <PostsPage
      title={copy.posts.tagTitle}
      desc={t(copy.posts.tagDesc, { name: tag, count: list.length })}
      list={list}
      nav="/tags"
      context={{ type: 'tag', name: tag }}
    />
  )
}

export default function App() {
  return (
    <>
      <ScrollManager />
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/posts" element={<PostsPage />} />
          <Route path="/posts/:slug" element={<Article />} />
          <Route path="/works" element={<WorksPage />} />
          <Route path="/works/:slug" element={<WorkDetail />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/categories/:name" element={<CategoryRoute />} />
          <Route path="/tags" element={<TagsPage />} />
          <Route path="/tags/:name" element={<TagRoute />} />
          <Route path="/archive" element={<ArchivePage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </>
  )
}
