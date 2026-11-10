/**
 * 把 Google Fonts 的 CSS 与 woff2 下载到项目里，改成纯本地引用。
 *
 * 跑法：npm run fonts
 * 产物：src/styles/fonts.css + src/styles/fonts/*.woff2
 *
 * 为什么保留全部 unicode-range 分片：中文字体按片段加载，
 * 浏览器只会取页面用到的那几片；换成单个「全量字体」反而更慢。
 * 新写的文章出现新汉字也不需要重新生成字体。
 */
import { mkdir, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const outDir = path.join(root, 'src/styles/fonts')
const cssOut = path.join(root, 'src/styles/fonts.css')

const CSS_URL =
  'https://fonts.googleapis.com/css2?family=ZCOOL+KuaiLe&family=Noto+Sans+SC:wght@100..900&family=JetBrains+Mono:wght@400&display=swap'
const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'

const res = await fetch(CSS_URL, { headers: { 'User-Agent': UA } })
if (!res.ok) throw new Error(`Google Fonts CSS 下载失败：${res.status}`)
const css = await res.text()

const urls = [...new Set([...css.matchAll(/url\((https:\/\/[^)]+\.woff2)\)/g)].map((m) => m[1]))]
if (!urls.length) throw new Error('CSS 里没有找到 woff2 链接，可能接口格式变了')

await mkdir(outDir, { recursive: true })

const names = new Map()
urls.forEach((url, i) => names.set(url, `font-${String(i + 1).padStart(3, '0')}.woff2`))

/* 并发下载，失败重试一次 */
async function download(url, name) {
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const r = await fetch(url, { headers: { 'User-Agent': UA } })
    if (!r.ok) throw new Error(`${r.status} ${url}`)
    const buf = Buffer.from(await r.arrayBuffer())
    await writeFile(path.join(outDir, name), buf)
    return buf.length
  }
  return 0
}

const sizes = []
const queue = [...urls]
await Promise.all(
  Array.from({ length: 12 }, async () => {
    while (queue.length) {
      const url = queue.shift()
      sizes.push(await download(url, names.get(url)))
    }
  })
)
const bytes = sizes.reduce((a, b) => a + b, 0)

const localCss = css.replace(/url\(https:\/\/[^)]+\.woff2\)/g, (whole) => {
  const url = whole.slice(4, -1)
  return `url(./fonts/${names.get(url)})`
})

await writeFile(
  cssOut,
  `/* 本文件由 npm run fonts 生成，请勿手改。\n   来源：Google Fonts（ZCOOL KuaiLe / Noto Sans SC / JetBrains Mono），已全部本地化。\n   共 ${urls.length} 个 woff2 分片，按 unicode-range 按需加载。 */\n${localCss}`
)

console.log(`已下载 ${urls.length} 个字体分片，共 ${(bytes / 1024 / 1024).toFixed(2)} MB`)
console.log(`CSS: ${path.relative(root, cssOut)}`)
