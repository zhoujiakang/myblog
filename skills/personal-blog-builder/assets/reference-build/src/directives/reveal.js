// v-reveal：元素进入视口时播放一次淡入上浮，播完自动清理类，避免与悬停 transform 冲突。
// 用法：v-reveal（默认无延迟）或 v-reveal="120"（延迟 120ms，用于错峰）。
const observer = new IntersectionObserver(
  (entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue
      const el = entry.target
      el.classList.add('reveal-in')
      // 动画结束后移除 reveal 类，让元素回到自然状态（hover 的 transform 才能生效）
      el.addEventListener(
        'animationend',
        () => el.classList.remove('reveal', 'reveal-in'),
        { once: true }
      )
      observer.unobserve(el)
    }
  },
  { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }
)

export const reveal = {
  mounted(el, binding) {
    el.classList.add('reveal')
    el.style.setProperty('--reveal-delay', `${binding.value ?? 0}ms`)
    observer.observe(el)
  },
  unmounted(el) {
    observer.unobserve(el)
  },
}
