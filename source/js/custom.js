(() => {
  const header = document.querySelector('#page-header.full_page')
  if (header) {
    const match = header.style.backgroundImage.match(/url\(["']?(.+?)["']?\)/)
    if (match) {
      const hero = new Image()
      const revealHero = () => header.classList.add('hero-ready')
      hero.addEventListener('load', revealHero, { once: true })
      hero.src = match[1]
      if (hero.complete) revealHero()
    }
  }

  const footer = document.querySelector('#footer')
  if (footer) {
    const match = footer.style.backgroundImage.match(/url\(["']?(.+?)["']?\)/)
    if (match) {
      const background = new Image()
      const revealFooter = () => footer.classList.add('footer-ready')
      background.addEventListener('load', revealFooter, { once: true })
      background.src = match[1]
      if (background.complete) revealFooter()
    }
  }

  const title = document.querySelector('#site-title')
  if (!title || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
  const text = title.textContent.trim()
  if (!text) return
  title.setAttribute('aria-label', text)
  title.classList.add('staggered-title')
  title.innerHTML = [...text].map((char, index) => `<span class="staggered-title__cell" style="--stagger-index:${index}"><span>${char === ' ' ? '&nbsp;' : char}</span></span>`).join('')
})()
