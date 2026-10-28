import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {
  parsePost,
  serializePost,
  readPosts,
  savePost,
  renderMarkdown,
} from '../server/content.mjs';
const input = {
  slug: 'first-post',
  title: '中文标题：与 "引号"',
  summary: '摘要',
  date: '2026-10-27',
  group: 'Java',
  tags: ['中文标签', 'Spring Boot'],
  body: '## 第一节\n\n正文',
  draft: false,
};
async function temp(t) {
  const dir = await fs.mkdtemp(path.join(os.tmpdir(), 'blog-test-'));
  t.after(() => fs.rm(dir, { recursive: true, force: true }));
  return dir;
}
test('Markdown metadata round-trips Chinese and special characters', () => {
  const result = parsePost(serializePost(input), input.slug);
  for (const key of Object.keys(input)) assert.deepEqual(result[key], input[key]);
});
test('published collection excludes drafts and sorts dates across years', async (t) => {
  const dir = await temp(t);
  for (const p of [
    input,
    { ...input, slug: 'old', date: '2025-01-01' },
    { ...input, slug: 'secret', draft: true },
  ])
    await savePost(dir, p);
  assert.deepEqual(
    (await readPosts(dir)).map((p) => p.slug),
    ['first-post', 'old'],
  );
  assert.equal((await readPosts(dir, { drafts: true })).length, 3);
});
test('writes refuse collisions, path traversal and stale revision', async (t) => {
  const dir = await temp(t),
    saved = await savePost(dir, input);
  await assert.rejects(savePost(dir, input), /同名/);
  await assert.rejects(savePost(dir, { ...input, slug: '../outside' }), /标识/);
  const updated = await savePost(dir, { ...input, title: '新标题', revision: saved.revision });
  assert.notEqual(updated.revision, saved.revision);
  await assert.rejects(savePost(dir, { ...input, revision: saved.revision }), /其他窗口/);
  assert.equal(
    parsePost(await fs.readFile(path.join(dir, 'first-post.md'), 'utf8'), input.slug).title,
    '新标题',
  );
});
test('metadata rejects invalid dates and types', () => {
  for (const data of [
    { date: '2026-02-30' },
    { tags: 'one,two' },
    { draft: 'false' },
    { title: '' },
  ])
    assert.throws(() => serializePost({ ...input, ...data }));
  assert.throws(() => parsePost('---\nx: !!js/function function(){}\n---\nbody', 'example'));
});
test('Markdown escapes raw HTML and unsafe links; code and headings render', () => {
  const result = renderMarkdown(
    '## 同名\n\n## 同名\n\n<script>alert(1)</script>\n\n[x](javascript:alert(1))\n\n```java\nString s = "<img>";\n```',
  );
  assert.deepEqual(
    result.toc.map((h) => h.id),
    ['section-1', 'section-2'],
  );
  assert.ok(!result.html.includes('<script>'));
  assert.ok(!result.html.includes('href="javascript:'));
  assert.match(result.html, /class="copy"/);
  assert.match(result.html, /&lt;img&gt;/);
});
test('images respect repository deployment base', () => {
  const result = renderMarkdown(
    '![图片](media/test.png)\n\n![远程](https://example.com/a.png)',
    '/my-blog/',
  );
  assert.match(result.html, /src="\/my-blog\/media\/test.png"/);
  assert.match(result.html, /src="https:\/\/example.com\/a.png"/);
});
