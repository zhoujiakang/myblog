import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import express from 'express'
import matter from 'gray-matter'
import { marked } from 'marked'
import multer from 'multer'
import sanitizeHtml from 'sanitize-html'

const appDir = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(appDir, '../..')
const postsDir = join(rootDir, 'source/_posts')
const draftsDir = join(rootDir, 'source/_drafts')
const imageRoot = join(rootDir, 'source/img/posts')
const publicDir = join(appDir, 'public')
const port = Number(process.env.BLOG_ADMIN_PORT || 4180)

await Promise.all([mkdir(postsDir, { recursive: true }), mkdir(draftsDir, { recursive: true }), mkdir(imageRoot, { recursive: true })])

const app = express()
app.disable('x-powered-by')
app.use(express.json({ limit: '3mb' }))

app.use('/api', (req, res, next) => {
  if (!['GET', 'HEAD'].includes(req.method)) {
    const origin = req.get('origin')
    if (origin && !/^https?:\/\/(127\.0\.0\.1|localhost)(:\d+)?$/.test(origin)) {
      return res.status(403).json({ error: '仅允许从本地管理界面操作' })
    }
  }
  next()
})

function encodeId(filePath) {
  return Buffer.from(relative(rootDir, filePath)).toString('base64url')
}

function resolveArticle(id) {
  const rel = Buffer.from(id, 'base64url').toString('utf8')
  const filePath = resolve(rootDir, rel)
  const allowed = [postsDir, draftsDir].some(dir => filePath.startsWith(`${dir}/`))
  if (!allowed || extname(filePath) !== '.md') throw new Error('无效的文章路径')
  return filePath
}

function listValue(value) {
  if (Array.isArray(value)) return value.map(String).filter(Boolean)
  if (!value) return []
  return [String(value)]
}

function localDate(value = new Date()) {
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return String(value || '')
  const parts = new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Asia/Shanghai', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
  }).formatToParts(date).reduce((all, item) => ({ ...all, [item.type]: item.value }), {})
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`
}

async function readArticle(filePath) {
  const raw = await readFile(filePath, 'utf8')
  const parsed = matter(raw)
  const info = await stat(filePath)
  return {
    id: encodeId(filePath),
    file: relative(rootDir, filePath),
    status: filePath.startsWith(postsDir) ? 'published' : 'draft',
    title: String(parsed.data.title || filePath.split('/').pop().replace(/\.md$/, '')),
    date: localDate(parsed.data.date || info.birthtime),
    categories: listValue(parsed.data.categories),
    tags: listValue(parsed.data.tags),
    description: String(parsed.data.description || ''),
    cover: String(parsed.data.cover || ''),
    content: parsed.content.replace(/^\n/, ''),
    modifiedAt: info.mtime.toISOString()
  }
}

async function articleFiles(dir) {
  const entries = await readdir(dir, { withFileTypes: true })
  return entries.filter(entry => entry.isFile() && entry.name.endsWith('.md')).map(entry => join(dir, entry.name))
}

async function allArticles() {
  const files = [...await articleFiles(postsDir), ...await articleFiles(draftsDir)]
  const articles = await Promise.all(files.map(readArticle))
  return articles.sort((a, b) => new Date(b.date) - new Date(a.date))
}

function safeSlug(value) {
  const slug = String(value || 'untitled')
    .trim().replace(/[\\/:*?"<>|#%{}]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-')
  return slug || `article-${Date.now()}`
}

async function uniqueFile(dir, title) {
  const slug = safeSlug(title)
  let candidate = join(dir, `${slug}.md`)
  let index = 2
  while (existsSync(candidate)) candidate = join(dir, `${slug}-${index++}.md`)
  return candidate
}

function articleDocument(input) {
  const data = {
    title: String(input.title || '未命名文章'),
    date: String(input.date || localDate()),
    categories: listValue(input.categories),
    tags: listValue(input.tags),
    description: String(input.description || ''),
    cover: String(input.cover || '')
  }
  for (const key of Object.keys(data)) {
    if (data[key] === '' || (Array.isArray(data[key]) && data[key].length === 0)) delete data[key]
  }
  return matter.stringify(String(input.content || '').trimStart(), data)
}

async function imageList() {
  const images = []
  async function walk(dir) {
    for (const entry of await readdir(dir, { withFileTypes: true })) {
      const path = join(dir, entry.name)
      if (entry.isDirectory()) await walk(path)
      else if (/\.(avif|gif|jpe?g|png|webp)$/i.test(entry.name)) images.push(`/${relative(join(rootDir, 'source'), path)}`)
    }
  }
  await walk(join(rootDir, 'source/img'))
  return images.sort()
}

function run(command, args) {
  return new Promise((resolvePromise, reject) => {
    const child = spawn(command, args, { cwd: rootDir, env: process.env })
    let output = ''
    child.stdout.on('data', chunk => { output = `${output}${chunk}`.slice(-16000) })
    child.stderr.on('data', chunk => { output = `${output}${chunk}`.slice(-16000) })
    child.on('error', reject)
    child.on('close', code => code === 0 ? resolvePromise(output) : reject(new Error(output || `${command} 执行失败`)))
  })
}

app.get('/api/state', async (req, res, next) => {
  try {
    const [articles, images, gitStatus] = await Promise.all([
      allArticles(), imageList(), run('git', ['status', '--short'])
    ])
    const tags = [...new Set(articles.flatMap(article => article.tags))].sort()
    const categories = [...new Set(articles.flatMap(article => article.categories))].sort()
    res.json({ articles, images, tags, categories, dirty: Boolean(gitStatus.trim()) })
  } catch (error) { next(error) }
})

app.get('/api/articles/:id', async (req, res, next) => {
  try { res.json(await readArticle(resolveArticle(req.params.id))) } catch (error) { next(error) }
})

app.post('/api/articles', async (req, res, next) => {
  try {
    const dir = req.body.status === 'published' ? postsDir : draftsDir
    const filePath = await uniqueFile(dir, req.body.title)
    await writeFile(filePath, articleDocument({ ...req.body, date: req.body.date || localDate() }), 'utf8')
    res.status(201).json(await readArticle(filePath))
  } catch (error) { next(error) }
})

app.put('/api/articles/:id', async (req, res, next) => {
  try {
    const oldPath = resolveArticle(req.params.id)
    const targetDir = req.body.status === 'published' ? postsDir : draftsDir
    let targetPath = join(targetDir, basename(oldPath))
    if (oldPath !== targetPath && existsSync(targetPath)) {
      targetPath = await uniqueFile(targetDir, basename(oldPath, '.md'))
    }
    await writeFile(oldPath, articleDocument(req.body), 'utf8')
    if (oldPath !== targetPath) await rename(oldPath, targetPath)
    res.json(await readArticle(targetPath))
  } catch (error) { next(error) }
})

app.delete('/api/articles/:id', async (req, res, next) => {
  try {
    await unlink(resolveArticle(req.params.id))
    res.status(204).end()
  } catch (error) { next(error) }
})

app.post('/api/preview', async (req, res, next) => {
  try {
    const html = sanitizeHtml(await marked.parse(String(req.body.content || '')), {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img']),
      allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes, img: ['src', 'alt', 'title'], code: ['class'] }
    })
    res.json({ html })
  } catch (error) { next(error) }
})

const upload = multer({
  storage: multer.diskStorage({
    destination(req, file, callback) {
      const folder = localDate().slice(0, 7)
      const destination = join(imageRoot, folder)
      mkdir(destination, { recursive: true }).then(() => callback(null, destination), callback)
    },
    filename(req, file, callback) {
      callback(null, `${Date.now()}-${randomUUID().slice(0, 8)}${extname(file.originalname).toLowerCase()}`)
    }
  }),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter(req, file, callback) {
    callback(/^image\//.test(file.mimetype) ? null : new Error('仅支持上传图片文件'), true)
  }
})

app.post('/api/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '请选择图片文件' })
  const url = `/${relative(join(rootDir, 'source'), req.file.path)}`
  res.status(201).json({ url, markdown: `![图片说明](${url})` })
})

let publishing = false
app.post('/api/publish', async (req, res, next) => {
  if (publishing) return res.status(409).json({ error: '发布任务正在运行' })
  publishing = true
  try {
    await run('pnpm', ['exec', 'hexo', 'clean'])
    await run('pnpm', ['exec', 'hexo', 'generate'])
    await run('git', ['add', '-A'])
    const staged = await run('git', ['diff', '--cached', '--name-only'])
    if (staged.trim()) await run('git', ['commit', '-m', String(req.body.message || '更新博客内容').slice(0, 100)])
    const output = await run('git', ['push'])
    res.json({ ok: true, changed: Boolean(staged.trim()), output: output.trim() })
  } catch (error) { next(error) } finally { publishing = false }
})

app.use('/api', (req, res) => res.status(404).json({ error: '接口不存在' }))
app.use('/img', express.static(join(rootDir, 'source/img')))
app.use(express.static(publicDir))
app.use((req, res) => res.sendFile(join(publicDir, 'index.html')))
app.use((error, req, res, next) => {
  console.error(error)
  res.status(500).json({ error: error.message || '服务器错误' })
})

app.listen(port, '127.0.0.1', () => {
  console.log(`Blog Studio: http://127.0.0.1:${port}`)
})
