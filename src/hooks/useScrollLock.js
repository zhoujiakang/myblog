import { useEffect } from 'react'

/* 浮层（搜索 / 手机菜单 / 文章目录）打开时锁住背景滚动：
   手机上很常见的迷失来源——浮层里点了一下，回来发现页面位置变了。
   用计数器而不是直接开关：多个浮层理论上可同时打开，最后一个关闭才解锁。 */
let lockCount = 0

export function useScrollLock(active) {
  useEffect(() => {
    if (!active) return undefined
    lockCount += 1
    document.documentElement.classList.add('scroll-locked')
    return () => {
      lockCount = Math.max(0, lockCount - 1)
      if (lockCount === 0) document.documentElement.classList.remove('scroll-locked')
    }
  }, [active])
}
