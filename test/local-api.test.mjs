import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { createServer } from 'vite';
import { blogPlugin } from '../server/plugin.mjs';
const data = {
  slug: 'api-example',
  title: '接口测试',
  summary: '',
  date: '2026-10-27',
  group: '自定义分组',
  tags: ['测试'],
  body: '## 内容\n\n正文',
  draft: true,
};
async function fixture(t, local) {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'blog-api-'));
  const server = await createServer({
    configFile: false,
    root,
    plugins: [blogPlugin({ local })],
    server: { host: '127.0.0.1', port: 0 },
    logLevel: 'silent',
  });
  await server.listen();
  const origin = `http://127.0.0.1:${server.httpServer.address().port}`;
  t.after(async () => {
    await server.close();
    await fs.rm(root, { recursive: true, force: true });
  });
  return {
    root,
    origin,
    post: (name, body, extra = {}) =>
      fetch(`${origin}/__local/${name}`, {
        method: 'POST',
        headers: {
          Origin: origin,
          'Content-Type': 'application/json',
          'X-Blog-Editor': '1',
          ...extra,
        },
        body: JSON.stringify(body),
      }),
  };
}
test('local API saves, lists, imports and renders; cross-origin writes denied', async (t) => {
  const { root, origin, post } = await fixture(t, true);
  let res = await post('posts', data, { Origin: 'https://outside.example' });
  assert.equal(res.status, 403);
  res = await post('posts', data);
  assert.equal(res.status, 200);
  const saved = await res.json();
  assert.ok(saved.revision);
  assert.match(
    await fs.readFile(path.join(root, 'content/posts/api-example.md'), 'utf8'),
    /draft: true/,
  );
  res = await fetch(`${origin}/__local/posts`);
  assert.equal((await res.json()).length, 1);
  res = await post('preview', { body: data.body });
  assert.match((await res.json()).html, /<h2 id=/);
  res = await post('import', { slug: 'imported', raw: '---javascript\nprocess.exit()\n---\nbody' });
  assert.equal(res.status, 400);
  res = await post('posts', { ...data, draft: false, revision: saved.revision });
  assert.equal(res.status, 200);
  res = await post('posts', { ...data, revision: saved.revision });
  assert.equal(res.status, 400);
});
test('public server does not expose local content APIs', async (t) => {
  const { origin, post } = await fixture(t, false);
  const response = await post('posts', data);
  assert.equal(response.status, 404);
  const list = await fetch(`${origin}/__local/posts`);
  assert.equal(list.status, 404);
});
