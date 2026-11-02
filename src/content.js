// 内容层：所有站点文案都放在仓库根的 content/ 目录，用 Markdown + 极简 frontmatter 维护。
// 改文案只需编辑对应 .md 文件，npm run dev 会自动热更新；部署时 npm run build 会把它们重新打包进网站。
// 新增一条作品 / 文章 / 技能：在对应目录新建一个 01-xxx.md（数字前缀决定顺序）。
//
// frontmatter 约定：
//   - 普通字段：key: value（value 可加引号，会自动去掉）
//   - 列表字段（now）：用 " | " 分隔多项
//   - about 的「数据统计」为自动统计：开源项目=works 文件数、分享文章=articles 文件数、
//     写代码年限=由 codingSince 起始时间算到今天，无需手写数字
//   - 多段正文：写在前面的 --- 下面（body），如关于页的 bio

const modules = import.meta.glob('../content/**/*.md', { query: '?raw', eager: true })

function parseFrontmatter(text) {
  const m = text.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/)
  if (!m) return { data: {}, body: text.trim() }
  const data = {}
  for (const line of m[1].split('\n')) {
    const i = line.indexOf(':')
    if (i === -1) continue
    const key = line.slice(0, i).trim()
    let val = line.slice(i + 1).trim()
    val = val.replace(/^["']|["']$/g, '')
    data[key] = val
  }
  return { data, body: m[2].trim() }
}

function pathOf(sub) {
  return Object.keys(modules).find((k) => k.endsWith(sub))
}

function readOne(sub) {
  const key = pathOf(sub)
  if (!key) return { data: {}, body: '' }
  const { data, body } = parseFrontmatter(modules[key].default)
  return { ...data, body }
}

// 读取一个目录下的全部 .md，按文件名排序（01- 在前），返回带 slug 的 frontmatter 对象数组
function readList(dir) {
  const prefix = `../content/${dir}/`
  return Object.keys(modules)
    .filter((k) => k.startsWith(prefix) && k.endsWith('.md'))
    .sort()
    .map((k) => {
      const slug = k.split('/').pop().replace(/\.md$/, '')
      return { ...parseFrontmatter(modules[k].default).data, slug }
    })
}

// 按 slug 读取单条详情（frontmatter + 正文 body）
function readItem(dir, slug) {
  const key = Object.keys(modules).find((k) =>
    k.endsWith(`/content/${dir}/${slug}.md`),
  )
  if (!key) return null
  const { data, body } = parseFrontmatter(modules[key].default)
  return { ...data, body, slug }
}

const siteRaw = readOne('/site.md')
export const site = {
  ...siteRaw,
  identity: (siteRaw.identity || '')
    .split('/')
    .map((s) => s.trim())
    .filter(Boolean),
  // 导航：把 "标签::路由 | 标签::路由" 解析成 [{ label, to }]
  nav: (siteRaw.nav || '')
    .split('|')
    .map((s) => {
      const [label, to] = s.split('::').map((x) => x.trim())
      return { label, to }
    })
    .filter((x) => x.label && x.to),
}
// 联系方式统一为「点击复制」，不再需要 mailto/tel 链接

const homeRaw = readOne('/home.md')
export const home = {
  ...homeRaw,
  entries: readList('home'),
}

export const works = readList('works')
export const skills = readList('skills')
export const articles = readList('articles')

export const getWork = (slug) => readItem('works', slug)
export const getArticle = (slug) => readItem('articles', slug)
export const getSkill = (slug) => readItem('skills', slug)

const aboutRaw = readOne('/about.md')

// 由「起始时间」自动算出到今天的年限（保留一位小数）
function yearsSince(since) {
  const parts = (since || '').match(/\d+/g)
  if (!parts) return 0
  const y = parseInt(parts[0], 10)
  const m = parts[1] ? parseInt(parts[1], 10) - 1 : 0
  const d = parts[2] ? parseInt(parts[2], 10) : 1
  const start = new Date(y, m, d)
  const now = new Date()
  const years = (now - start) / (365.25 * 24 * 3600 * 1000)
  return Math.max(0, Math.round(years * 10) / 10)
}

// 数据统计：全部自动计算，绝不写死
//   - 开源项目 = works 目录下的 .md 数量（你加一个作品就 +1）
//   - 分享文章 = articles 目录下的 .md 数量
//   - 写代码   = 由 codingSince 起始时间算到今天
export const about = {
  bio: aboutRaw.body,
  stats: [
    { num: works.length, unit: 'repo', label: '开源项目' },
    { num: articles.length, unit: 'posts', label: '分享文章' },
    { num: yearsSince(aboutRaw.codingSince), unit: 'yr', label: '写代码' },
  ],
  now: (aboutRaw.now || '')
    .split(' | ')
    .map((s) => s.trim())
    .filter(Boolean),
}
