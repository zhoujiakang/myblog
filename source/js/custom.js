(() => {
  const title = document.querySelector('#site-title')
  if (!title || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const text = title.textContent.trim()
  if (!text) return
  title.setAttribute('aria-label', text)
  title.classList.add('staggered-title')
  title.innerHTML = [...text].map((char, index) => `<span class="staggered-title__cell" style="--stagger-index:${index}"><span>${char === ' ' ? '&nbsp;' : char}</span></span>`).join('')
})()
