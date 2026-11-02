import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import fs from 'node:fs'
import path from 'node:path'

// base 用相对路径 './'，配合 hash 路由，
// 构建产物直接丢到 GitHub Pages（根域或 /仓库名/ 子路径）都能跑。
export default defineConfig({
  base: './',
  plugins: [vue(), injectMeta()],
})

// 从 content/site.md 读取 frontmatter，注入到 index.html 的 <head>：
//  - <title> / <meta name="description">
//  - Open Graph（og:title/description/image/url/type）—— 微信/Telegram/Facebook 等分享时显示的预览卡
//  - Twitter Card（twitter:title/description/image/card）
// 这样所有对外文案都在 content/site.md 一处维护，改完 build 即生效。
function injectMeta() {
  function parseFrontmatter(text) {
    const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
    if (!m) return {}
    const data = {}
    for (const line of m[1].split('\n')) {
      const i = line.indexOf(':')
      if (i === -1) continue
      const key = line.slice(0, i).trim()
      let val = line.slice(i + 1).trim()
      val = val.replace(/^["']|["']$/g, '')
      data[key] = val
    }
    return data
  }

  return {
    name: 'inject-meta',
    transformIndexHtml(html) {
      let fm = {}
      try {
        const raw = fs.readFileSync(
          path.resolve(process.cwd(), 'content/site.md'),
          'utf-8',
        )
        fm = parseFrontmatter(raw)
      } catch {
        return html
      }

      const title = fm.seoTitle || `${fm.name || ''} ${fm.tagline || ''}`.trim()
      const desc = fm.seoDescription || ''
      const url = (fm.siteUrl || '').replace(/\/$/, '')
      const img = url ? `${url}/og-cover.png` : ''

      const tags = [
        `<title>${title}</title>`,
        `<meta name="description" content="${desc}">`,
        `<meta property="og:type" content="website">`,
        `<meta property="og:title" content="${title}">`,
        `<meta property="og:description" content="${desc}">`,
        `<meta property="og:url" content="${url}">`,
        img && `<meta property="og:image" content="${img}">`,
        `<meta name="twitter:card" content="summary_large_image">`,
        `<meta name="twitter:title" content="${title}">`,
        `<meta name="twitter:description" content="${desc}">`,
        img && `<meta name="twitter:image" content="${img}">`,
      ].filter(Boolean)

      return html.replace('</head>', `  ${tags.join('\n  ')}\n</head>`)
    },
  }
}
