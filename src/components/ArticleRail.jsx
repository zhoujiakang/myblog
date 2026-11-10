import { useEffect, useState } from 'react'
import { copy, t } from '../data/site'
import { BackLink } from './BackLink'
import { useScrollLock } from '../hooks/useScrollLock'

/* 手机端文章工具条 —— 顶部一条，同时放「返回」与「目录」。
 *
 * 原来这两样都跟着侧栏堆在正文末尾：读完才看得见目录，想退出也得先滚到底，
 * 位置和用途正好是反的。现在一起吸在手机页头下方：
 *   - 返回：按进入来源指向文章列表 / 分类 / 标签 / 折腾记录，随时能点
 *   - 目录：默认收起只占一行，点开是带序号的小节列表，选完自动收起
 * 桌面端整条由 CSS 隐藏，仍用右侧吸附的 .toc，两边互不影响。 */
export function ArticleRail({ back, toc, active, onJump, label, resetKey }) {
  const [open, setOpen] = useState(false)

  /* 目录面板展开时锁背景滚动 */
  useScrollLock(open)

  /* 上下篇连着点时组件不卸载，目录要收回去 */
  useEffect(() => {
    setOpen(false)
  }, [resetKey])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (e) => {
      if (e.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <>
      {open ? (
        <div
          className="article-rail-backdrop"
          onClick={() => setOpen(false)}
          role="presentation"
          aria-hidden="true"
        />
      ) : null}

      <div className={open ? 'article-rail article-rail--open' : 'article-rail'}>
        <div className="article-rail-row">
          {/* 历史栈里有上一页时走真正的后退：来源页恢复到离开时的位置 */}
          <BackLink className="article-rail-back" to={back.to}>
            {back.label}
          </BackLink>

          {toc.length ? (
            <button
              type="button"
              className="article-rail-toggle"
              aria-expanded={open}
              aria-controls="article-toc-panel"
              aria-label={open ? copy.common.tocCollapse : copy.common.tocExpand}
              onClick={() => setOpen((v) => !v)}
            >
              <span className="article-rail-toggle-text">{label}</span>
              <span className="article-rail-count">
                {t(copy.common.tocCount, { count: toc.length })}
              </span>
              <span className="article-rail-chevron" aria-hidden="true" />
            </button>
          ) : null}
        </div>

        {open && toc.length ? (
          <nav id="article-toc-panel" className="article-rail-panel" aria-label={label}>
            <ol className="article-rail-list">
              {toc.map((item, i) => (
                <li key={`${i}-${item}`}>
                  <a
                    className={
                      i === active
                        ? 'article-rail-link article-rail-link--active'
                        : 'article-rail-link'
                    }
                    href={`#section-${i}`}
                    onClick={(e) => {
                      /* HashRouter 下 hash 是路由本身，放行原生锚点会落进 404 */
                      e.preventDefault()
                      onJump(i)
                      setOpen(false)
                    }}
                  >
                    <span className="article-rail-index">{String(i + 1).padStart(2, '0')}</span>
                    <span className="article-rail-link-text">{item}</span>
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        ) : null}
      </div>
    </>
  )
}
