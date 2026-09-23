import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import { chmod, mkdir, readFile, readdir, rename, stat, unlink, writeFile } from 'node:fs/promises'
import { basename, dirname, extname, join, relative, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { randomUUID } from 'node:crypto'
import express from 'express'
import matter from 'gray-matter'
import { marked } from 'marked'
import multer from 'multer'
import sanitizeHtml from 'sanitize-html'

const appDir = dirname(fileURLToPath(import.meta.url))
const rootDir = resolve(process.env.BLOG_PROJECT_DIR || resolve(appDir, '../..'))
const postsDir = join(rootDir, 'source/_posts')
const draftsDir = join(rootDir, 'source/_drafts')
const imageRoot = join(rootDir, 'source/img/posts')
const publicDir = join(appDir, 'public')
const studioDir = join(rootDir, '.blog-studio')
const configDir = resolve(process.env.BLOG_ADMIN_CONFIG_DIR || studioDir)
const notesPath = join(studioDir, 'notes.json')
const deepseekConfigPath = join(configDir, 'deepseek.json')
const port = Number(process.env.BLOG_ADMIN_PORT || 4180)

await Promise.all([
  mkdir(postsDir, { recursive: true }), mkdir(draftsDir, { recursive: true }), mkdir(imageRoot, { recursive: true }),
  mkdir(studioDir, { recursive: true }), mkdir(configDir, { recursive: true })
])

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

async function readJson(path, fallback) {
  try { return JSON.parse(await readFile(path, 'utf8')) } catch (error) {
    if (error.code === 'ENOENT') return fallback
    throw error
  }
}

async function notes() {
  const items = await readJson(notesPath, [])
  return Array.isArray(items) ? items.sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))) : []
}

async function saveNotes(items) {
  await writeFile(notesPath, JSON.stringify(items, null, 2), 'utf8')
}

function noteSummary(note) {
  return {
    id: note.id,
    title: String(note.title || '').trim() || '未命名随心记',
    content: String(note.content || ''),
    createdAt: note.createdAt,
    updatedAt: note.updatedAt
  }
}

async function deepseekConfig() {
  const config = await readJson(deepseekConfigPath, {})
  return { apiKey: String(config.apiKey || '').trim() }
}

function parseAiJson(value) {
  const clean = String(value || '').trim().replace(/^```json\s*/i, '').replace(/\s*```$/, '')
  const start = clean.indexOf('{')
  const end = clean.lastIndexOf('}')
  if (start < 0 || end < start) throw new Error('AI 没有返回可用的文章结构，请重试')
  return JSON.parse(clean.slice(start, end + 1))
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

function runHexo(args) {
  const hexoBin = resolve(appDir, '../../node_modules/hexo/bin/hexo')
  return run(process.execPath, [hexoBin, ...args])
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

app.get('/api/notes', async (req, res, next) => {
  try { res.json({ notes: (await notes()).map(noteSummary) }) } catch (error) { next(error) }
})

app.post('/api/notes', async (req, res, next) => {
  try {
    const items = await notes()
    const now = new Date().toISOString()
    const note = {
      id: randomUUID(), title: String(req.body.title || ''), content: String(req.body.content || ''),
      createdAt: now, updatedAt: now
    }
    items.push(note)
    await saveNotes(items)
    res.status(201).json(noteSummary(note))
  } catch (error) { next(error) }
})

app.put('/api/notes/:id', async (req, res, next) => {
  try {
    const items = await notes()
    const note = items.find(item => item.id === req.params.id)
    if (!note) return res.status(404).json({ error: '随心记不存在' })
    note.title = String(req.body.title || '')
    note.content = String(req.body.content || '')
    note.updatedAt = new Date().toISOString()
    await saveNotes(items)
    res.json(noteSummary(note))
  } catch (error) { next(error) }
})

app.delete('/api/notes/:id', async (req, res, next) => {
  try {
    const items = await notes()
    const nextItems = items.filter(item => item.id !== req.params.id)
    if (nextItems.length === items.length) return res.status(404).json({ error: '随心记不存在' })
    await saveNotes(nextItems)
    res.status(204).end()
  } catch (error) { next(error) }
})

app.get('/api/deepseek/config', async (req, res, next) => {
  try {
    const { apiKey } = await deepseekConfig()
    res.json({ configured: Boolean(apiKey), model: 'deepseek-chat' })
  } catch (error) { next(error) }
})

app.put('/api/deepseek/config', async (req, res, next) => {
  try {
    const apiKey = String(req.body.apiKey || '').trim()
    if (!apiKey) return res.status(400).json({ error: '请输入 DeepSeek API Key' })
    await writeFile(deepseekConfigPath, JSON.stringify({ apiKey }, null, 2), { encoding: 'utf8', mode: 0o600 })
    await chmod(deepseekConfigPath, 0o600)
    res.json({ configured: true })
  } catch (error) { next(error) }
})

app.post('/api/deepseek/organize', async (req, res, next) => {
  try {
    const { apiKey } = await deepseekConfig()
    if (!apiKey) return res.status(400).json({ error: '请先在设置中保存 DeepSeek API Key' })
    const ids = [...new Set(Array.isArray(req.body.noteIds) ? req.body.noteIds.map(String) : [])]
    if (!ids.length) return res.status(400).json({ error: '请至少选择一条随心记' })
    const selected = (await notes()).filter(note => ids.includes(note.id))
    if (!selected.length) return res.status(400).json({ error: '没有找到所选随心记' })

    const source = selected.map((note, index) => `【碎片 ${index + 1}${note.title ? `：${note.title}` : ''}】\n${note.content}`).join('\n\n')
    const response = await fetch('https://api.deepseek.com/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: 'deepseek-chat', temperature: 0.7,
        messages: [
          {
            role: 'system',
            content: '你是中文博客编辑。只能依据用户提供的碎片整理，不得虚构事实、引文或书中内容。保留有价值的个人思考，清晰地区分事实与观点。只返回一个 JSON 对象，不要 Markdown 代码块。JSON 格式为 {"title":"", "description":"", "categories":[""], "tags":[""], "content":"Markdown 正文"}。正文应有自然标题层级，语言像个人博客而非模板化总结。'
          },
          { role: 'user', content: `请将以下随心记整理为一篇可继续编辑的博客草稿。\n\n${source}` }
        ]
      })
    })
    const payload = await response.json().catch(() => ({}))
    if (!response.ok) throw new Error(payload?.error?.message || 'DeepSeek 请求失败')
    const article = parseAiJson(payload?.choices?.[0]?.message?.content)
    res.json({
      title: String(article.title || '未命名文章'), description: String(article.description || ''),
      categories: listValue(article.categories), tags: listValue(article.tags), content: String(article.content || '')
    })
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
    await runHexo(['clean'])
    await runHexo(['generate'])
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

const server = app.listen(port, '127.0.0.1', () => {
  const address = server.address()
  const actualPort = typeof address === 'object' && address ? address.port : port
  console.log(`Blog Studio: http://127.0.0.1:${actualPort}`)
})
