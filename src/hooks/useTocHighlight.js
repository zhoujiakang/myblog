import { useEffect, useState } from 'react'
import { config } from '../data/site'

/** 目录跟随阅读进度高亮，文章页与折腾详情页共用。
 *  以视口上方约 1/3 处为判定线，最后一个越过判定线的小节即为当前小节。
 *  点击目录仍然立即高亮，平滑滚动结束后会自然对齐。 */
export function useTocHighlight(tocCount, resetKey) {
  const [active, setActive] = useState(0)

  /* 同一 Route 下换 slug 时组件不卸载，高亮要显式归零 */
  useEffect(() => {
    setActive(0)
  }, [resetKey])

  useEffect(() => {
    if (!tocCount) return undefined
    let frame = 0
    const update = () => {
      const line = window.innerHeight * config.tocLineRatio
      let current = 0
      for (let i = 0; i < tocCount; i += 1) {
        const el = document.getElementById(`section-${i}`)
        if (el && el.getBoundingClientRect().top <= line) current = i
      }
      setActive(current)
    }
    const onScroll = () => {
      if (frame) return
      frame = requestAnimationFrame(() => {
        frame = 0
        update()
      })
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [resetKey, tocCount])

  return [active, setActive]
}
