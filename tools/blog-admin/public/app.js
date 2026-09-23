const $ = selector => document.querySelector(selector)
const $$ = selector => [...document.querySelectorAll(selector)]

const state = {
  articles: [], images: [], tags: [], categories: [], activeId: null,
  filter: 'all', query: '', dirty: false, previewTimer: null
}

const fields = {
  title: $('#title'), status: $('#status'), date: $('#date'), categories: $('#categories'),
  description: $('#description'), tags: $('#tags'), cover: $('#cover'), content: $('#content')
}

async function api(url, options = {}) {
  const response = await fetch(url, {
    headers: options.body instanceof FormData ? undefined : { 'Content-Type': 'application/json' },
    ...options
  })
  if (!response.ok) {
    const data = await response.json().catch(() => ({}))
    throw new Error(data.error || `请求失败 (${response.status})`)
  }
  if (response.status === 204) return null
  return response.json()
}

function toast(message, error = false) {
  const element = $('#toast')
  element.textContent = message
  element.className = `toast show${error ? ' error' : ''}`
  clearTimeout(element.timer)
  element.timer = setTimeout(() => { element.className = 'toast' }, 3200)
}

function splitList(value) {
  return value.split(/[,，]/).map(item => item.trim()).filter(Boolean)
}

function setDirty(value) {
  state.dirty = value
  $('#saveState').textContent = value ? '有未保存的修改' : '已保存'
  $('#saveState').classList.toggle('unsaved', value)
}

function renderCounts() {
  $('#allCount').textContent = state.articles.length
  $('#draftCount').textContent = state.articles.filter(item => item.status === 'draft').length
  $('#publishedCount').textContent = state.articles.filter(item => item.status === 'published').length
}

function visibleArticles() {
  const query = state.query.toLowerCase()
  return state.articles.filter(article => {
    const matchesFilter = state.filter === 'all' || article.status === state.filter
    const haystack = [article.title, article.description, ...article.tags, ...article.categories].join(' ').toLowerCase()
    return matchesFilter && haystack.includes(query)
  })
}

function renderList() {
  renderCounts()
  const list = $('#articleList')
  const articles = visibleArticles()
  if (!articles.length) {
    list.innerHTML = '<div class="list-empty">暂无文章</div>'
    return
  }
  list.innerHTML = articles.map(article => `
    <button class="article-item ${article.id === state.activeId ? 'active' : ''}" data-id="${article.id}">
      <strong>${escapeHtml(article.title)}</strong>
      <div><span>${article.date.slice(0, 10)}</span><span class="status-pill ${article.status}">${article.status === 'draft' ? '草稿' : '已发布'}</span></div>
    </button>`).join('')
  $$('.article-item').forEach(button => button.addEventListener('click', () => selectArticle(button.dataset.id)))
}

function escapeHtml(value) {
  const div = document.createElement('div')
  div.textContent = value
  return div.innerHTML
}

function fillOptions() {
  $('#tagOptions').innerHTML = state.tags.map(value => `<option value="${escapeHtml(value)}">`).join('')
  $('#categoryOptions').innerHTML = state.categories.map(value => `<option value="${escapeHtml(value)}">`).join('')
  fields.cover.innerHTML = '<option value="">使用默认封面</option>' + state.images.map(value => `<option value="${value}">${value}</option>`).join('')
  renderTagSuggestions()
}

function renderTagSuggestions() {
  const selected = new Set(splitList(fields.tags.value))
  $('#tagSuggestions').innerHTML = state.tags.map(value => `
    <button type="button" class="tag-choice${selected.has(value) ? ' selected' : ''}" data-tag="${escapeHtml(value)}">${escapeHtml(value)}</button>
  `).join('')
  $$('.tag-choice').forEach(button => button.addEventListener('click', () => {
    const tags = splitList(fields.tags.value)
    const index = tags.indexOf(button.dataset.tag)
    if (index >= 0) tags.splice(index, 1)
    else tags.push(button.dataset.tag)
    fields.tags.value = tags.join(', ')
    setDirty(true)
    renderTagSuggestions()
  }))
}

function articlePayload() {
  return {
    title: fields.title.value.trim(), status: fields.status.value, date: fields.date.value.trim(),
    categories: splitList(fields.categories.value), tags: splitList(fields.tags.value),
    description: fields.description.value.trim(), cover: fields.cover.value, content: fields.content.value
  }
}

function showEditor(article) {
  $('#emptyState').classList.add('hidden')
  $('#editorForm').classList.remove('hidden')
  $('#saveArticle').disabled = false
  $('#deleteArticle').disabled = false
  $('#documentName').textContent = article.file
  for (const key of ['title', 'status', 'date', 'description', 'cover', 'content']) fields[key].value = article[key] || ''
  fields.categories.value = article.categories.join(', ')
  fields.tags.value = article.tags.join(', ')
  setDirty(false)
  updateCover()
  updatePreview()
}

async function selectArticle(id) {
  if (state.dirty && !confirm('当前修改尚未保存，仍要切换文章吗？')) return
  try {
    const article = await api(`/api/articles/${encodeURIComponent(id)}`)
    state.activeId = article.id
    showEditor(article)
    renderList()
  } catch (error) { toast(error.message, true) }
}

async function loadState(selectFirst = false) {
  try {
    const data = await api('/api/state')
    Object.assign(state, data)
    fillOptions()
    renderList()
    if (selectFirst && data.articles.length) await selectArticle(data.articles[0].id)
  } catch (error) { toast(error.message, true) }
}

async function saveArticle() {
  if (!state.activeId) return false
  if (!fields.title.value.trim()) {
    toast('请填写文章标题', true)
    return false
  }
  $('#saveArticle').disabled = true
  $('#saveState').textContent = '保存中...'
  try {
    const article = await api(`/api/articles/${encodeURIComponent(state.activeId)}`, {
      method: 'PUT', body: JSON.stringify(articlePayload())
    })
    state.activeId = article.id
    await loadState()
    showEditor(article)
    toast('文章已保存')
    return true
  } catch (error) {
    toast(error.message, true)
    setDirty(true)
    return false
  }
  finally { $('#saveArticle').disabled = false }
}

function openNewDialog() {
  $('#newTitle').value = ''
  $('#newStatus').value = 'draft'
  $('#newDialog').showModal()
  requestAnimationFrame(() => $('#newTitle').focus())
}

async function createArticle(event) {
  event.preventDefault()
  if (!$('#newTitle').value.trim()) return
  try {
    const article = await api('/api/articles', {
      method: 'POST', body: JSON.stringify({ title: $('#newTitle').value.trim(), status: $('#newStatus').value })
    })
    $('#newDialog').close()
    await loadState()
    state.activeId = article.id
    showEditor(article)
    renderList()
    toast('文章已创建')
  } catch (error) { toast(error.message, true) }
}

async function deleteArticle() {
  if (!state.activeId || !confirm('确定删除这篇文章吗？删除内容仍可通过 Git 历史恢复。')) return
  try {
    await api(`/api/articles/${encodeURIComponent(state.activeId)}`, { method: 'DELETE' })
    state.activeId = null
    $('#editorForm').classList.add('hidden')
    $('#emptyState').classList.remove('hidden')
    $('#saveArticle').disabled = true
    $('#deleteArticle').disabled = true
    $('#documentName').textContent = '未选择文章'
    await loadState(true)
    toast('文章已删除')
  } catch (error) { toast(error.message, true) }
}

async function updatePreview() {
  clearTimeout(state.previewTimer)
  state.previewTimer = setTimeout(async () => {
    try {
      const { html } = await api('/api/preview', { method: 'POST', body: JSON.stringify({ content: fields.content.value }) })
      $('#preview').innerHTML = html || '<p style="color:#959ca8">预览为空</p>'
    } catch (error) { $('#preview').textContent = error.message }
  }, 180)
}

function updateCover() {
  $('#coverThumb').innerHTML = fields.cover.value ? `<img src="${fields.cover.value}" alt="封面预览">` : '<i data-lucide="image"></i>'
  window.lucide?.createIcons()
}

function insertText(before, after = '', fallback = '') {
  const textarea = fields.content
  const start = textarea.selectionStart
  const end = textarea.selectionEnd
  const selected = textarea.value.slice(start, end) || fallback
  textarea.setRangeText(`${before}${selected}${after}`, start, end, 'end')
  textarea.focus()
  setDirty(true)
  updatePreview()
}

const formats = {
  bold: () => insertText('**', '**', '粗体文字'),
  italic: () => insertText('*', '*', '斜体文字'),
  heading: () => insertText('## ', '', '小标题'),
  link: () => insertText('[', '](https://)', '链接文字'),
  code: () => insertText('\n```\n', '\n```\n', '代码')
}

async function uploadImage(file) {
  if (!file) return
  const form = new FormData()
  form.append('image', file)
  try {
    toast('正在上传图片...')
    const data = await api('/api/upload', { method: 'POST', body: form })
    insertText(data.markdown, '\n')
    const refreshed = await api('/api/state')
    state.images = refreshed.images
    fillOptions()
    toast('图片已插入文章')
  } catch (error) { toast(error.message, true) }
  $('#imageInput').value = ''
}

async function publish() {
  if (state.dirty && !await saveArticle()) return
  $('#confirmPublish').disabled = true
  $('#confirmPublish').querySelector('span').textContent = '发布中...'
  try {
    const data = await api('/api/publish', {
      method: 'POST', body: JSON.stringify({ message: $('#commitMessage').value.trim() || '更新博客内容' })
    })
    $('#publishDialog').close()
    toast(data.changed ? '已推送，GitHub 正在部署' : '已同步到 GitHub')
    await loadState()
  } catch (error) { toast(error.message, true) }
  finally {
    $('#confirmPublish').disabled = false
    $('#confirmPublish').querySelector('span').textContent = '确认发布'
  }
}

Object.values(fields).forEach(field => field.addEventListener('input', () => {
  setDirty(true)
  if (field === fields.content) updatePreview()
  if (field === fields.cover) updateCover()
  if (field === fields.tags) renderTagSuggestions()
}))

$('#newArticle').addEventListener('click', openNewDialog)
$('#emptyNew').addEventListener('click', openNewDialog)
$('#newForm').addEventListener('submit', createArticle)
$('#saveArticle').addEventListener('click', saveArticle)
$('#deleteArticle').addEventListener('click', deleteArticle)
$('#articleSearch').addEventListener('input', event => { state.query = event.target.value; renderList() })
$$('.filter-tabs button').forEach(button => button.addEventListener('click', () => {
  state.filter = button.dataset.filter
  $$('.filter-tabs button').forEach(item => item.classList.toggle('active', item === button))
  renderList()
}))
$$('[data-format]').forEach(button => button.addEventListener('click', () => formats[button.dataset.format]()))
$$('[data-view]').forEach(button => button.addEventListener('click', () => {
  $$('.view-switch button').forEach(item => item.classList.toggle('active', item === button))
  $('#workspace').className = `workspace view-${button.dataset.view}`
  if (button.dataset.view !== 'write') updatePreview()
}))
$('#uploadImage').addEventListener('click', () => $('#imageInput').click())
$('#imageInput').addEventListener('change', event => uploadImage(event.target.files[0]))
$('#openPublish').addEventListener('click', () => $('#publishDialog').showModal())
$('#publishForm').addEventListener('submit', event => { event.preventDefault(); publish() })

document.addEventListener('keydown', event => {
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 's') {
    event.preventDefault()
    saveArticle()
  }
})
window.addEventListener('beforeunload', event => { if (state.dirty) event.preventDefault() })

window.lucide?.createIcons()
loadState(true)
