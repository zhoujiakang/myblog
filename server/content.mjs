import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';
import matter from 'gray-matter';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';

export const escape = (s) =>
  String(s).replace(
    /[&<>"']/g,
    (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c],
  );
export const revision = (raw) => crypto.createHash('sha256').update(raw).digest('hex');
export function validatePost(input, slug) {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug) || slug.length > 100)
    throw new Error('文章标识须为 1–100 位小写字母、数字和短横线');
  const data = input || {};
  const date = data.date instanceof Date ? data.date.toISOString().slice(0, 10) : data.date;
  if (
    typeof date !== 'string' ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    !Number.isFinite(Date.parse(date)) ||
    new Date(date).toISOString().slice(0, 10) !== date
  )
    throw new Error('发布日期须为有效的 YYYY-MM-DD 日期');
  for (const key of ['title', 'group'])
    if (typeof data[key] !== 'string' || !data[key].trim() || data[key].length > 200)
      throw new Error(`${key === 'title' ? '标题' : '分组'}不能为空，且不能超过 200 字`);
  if (data.summary !== undefined && typeof data.summary !== 'string')
    throw new Error('摘要必须是文本');
  if (
    !Array.isArray(data.tags) ||
    data.tags.length > 30 ||
    data.tags.some((t) => typeof t !== 'string' || !t.trim() || t.length > 60)
  )
    throw new Error('标签须为文本数组，最多 30 个，每个最多 60 字');
  if (data.draft !== undefined && typeof data.draft !== 'boolean')
    throw new Error('draft 必须为 true 或 false');
  return {
    slug,
    title: data.title.trim(),
    summary: data.summary || '',
    date,
    group: data.group.trim(),
    tags: [...new Set(data.tags.map((t) => t.trim()))],
    draft: data.draft ?? false,
  };
}
export function parsePost(raw, slug) {
  if (typeof raw !== 'string' || !/^---\r?\n/.test(raw))
    throw new Error('文章须以 YAML 元数据开头：--- 后换行');
  // Accept only a YAML delimiter; never allow gray-matter JavaScript engines.
  const parsed = matter(raw);
  const data = validatePost(parsed.data, slug);
  return { ...data, body: parsed.content.trim(), revision: revision(raw) };
}
export function serializePost(input) {
  const data = validatePost(input, input.slug);
  if (typeof input.body !== 'string' || !input.body.trim()) throw new Error('正文不能为空');
  const { slug, ...frontmatter } = data;
  // JSON is valid YAML, avoiding ambiguous dates, special characters and custom types.
  return `---\n${Object.entries(frontmatter)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n')}\n---\n\n${input.body.trim()}\n`;
}
export function renderMarkdown(body, base = '/') {
  const toc = [];
  const md = new MarkdownIt({ html: false, linkify: true, typographer: false });
  md.renderer.rules.fence = (tokens, idx) => {
    const token = tokens[idx],
      lang = token.info.trim().split(/\s+/)[0];
    const code = hljs.getLanguage(lang)
      ? hljs.highlight(token.content, { language: lang }).value
      : escape(token.content);
    return `<div class="code-block"><div class="bar"><span>${escape(lang || 'text')}</span><button class="copy" type="button">复制</button></div><pre><code>${code}</code></pre></div>`;
  };
  const image = md.renderer.rules.image;
  md.renderer.rules.image = (tokens, idx, options, env, self) => {
    const src = tokens[idx].attrGet('src') || '';
    if (!/^(?:[a-z]+:|\/\/|#)/i.test(src))
      tokens[idx].attrSet('src', base + src.replace(/^\//, ''));
    return image(tokens, idx, options, env, self);
  };
  const tokens = md.parse(body, {});
  for (let i = 0; i < tokens.length; i++) {
    if (tokens[i].type === 'heading_open') {
      const id = `section-${toc.length + 1}`;
      tokens[i].attrSet('id', id);
      toc.push({
        id,
        level: Number(tokens[i].tag.slice(1)),
        text: tokens[i + 1].content.replace(/[*`]/g, ''),
      });
    }
  }
  return { html: md.renderer.render(tokens, md.options, {}), toc };
}
export async function readPosts(directory, { drafts = false, base = '/' } = {}) {
  await fs.mkdir(directory, { recursive: true });
  const files = (await fs.readdir(directory, { withFileTypes: true })).filter(
    (f) => f.isFile() && f.name.endsWith('.md'),
  );
  const posts = await Promise.all(
    files.map(async (file) => {
      try {
        const post = parsePost(
          await fs.readFile(path.join(directory, file.name), 'utf8'),
          file.name.slice(0, -3),
        );
        const words = post.body.replace(/\s/g, '').length;
        return {
          ...post,
          ...renderMarkdown(post.body, base),
          words,
          minutes: Math.max(1, Math.ceil(words / 350)),
        };
      } catch (e) {
        throw new Error(`${file.name}: ${e.message}`);
      }
    }),
  );
  return posts
    .filter((p) => drafts || !p.draft)
    .sort((a, b) => b.date.localeCompare(a.date) || a.slug.localeCompare(b.slug));
}
export async function savePost(directory, input) {
  const raw = serializePost(input);
  const file = path.join(directory, `${input.slug}.md`);
  await fs.mkdir(directory, { recursive: true });
  if (input.revision) {
    const info = await fs.lstat(file).catch(() => null);
    if (!info || !info.isFile() || revision(await fs.readFile(file, 'utf8')) !== input.revision)
      throw new Error('文章已被其他窗口或外部编辑器修改，请重新加载后再保存');
    const temp = path.join(directory, `.${crypto.randomUUID()}.tmp`);
    try {
      await fs.writeFile(temp, raw, { flag: 'wx' });
      await fs.rename(temp, file);
    } finally {
      await fs.rm(temp, { force: true });
    }
  } else {
    try {
      await fs.writeFile(file, raw, { flag: 'wx' });
    } catch (e) {
      if (e.code === 'EEXIST') throw new Error('同名文章已存在，请更换文章标识或先加载已有文章');
      throw e;
    }
  }
  return parsePost(raw, input.slug);
}
