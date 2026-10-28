import path from 'node:path';
import fs from 'node:fs/promises';
import { readPosts, parsePost, savePost, renderMarkdown } from './content.mjs';

export function blogPlugin({ local = false, base = '/' }) {
  let root, postsDirectory, server;
  let queue = Promise.resolve();
  const id = '\0virtual:blog-content';
  return {
    name: 'blog-content-and-local-editor',
    configResolved(config) {
      root = config.root;
      postsDirectory = path.join(root, 'content/posts');
    },
    resolveId(source) {
      if (source === 'virtual:blog-content') return id;
    },
    async load(source) {
      if (source !== id) return;
      const posts = await readPosts(postsDirectory, { base });
      return `export default ${JSON.stringify(posts.map(({ revision, draft, ...p }) => p))}`;
    },
    configureServer(vite) {
      server = vite;
      server.watcher.add(postsDirectory);
      const invalidate = (file) => {
        if (!file.startsWith(postsDirectory + path.sep)) return;
        const mod = server.moduleGraph.getModuleById(id);
        if (mod) server.reloadModule(mod);
      };
      for (const event of ['add', 'change', 'unlink']) server.watcher.on(event, invalidate);
      if (!local) return;
      server.middlewares.use('/__local', async (req, res) => {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
        const send = (status, data) => {
          res.statusCode = status;
          res.end(JSON.stringify(data));
        };
        try {
          const host = req.headers.host || '';
          if (!/^(127\.0\.0\.1|localhost)(:\d+)?$/.test(host))
            return send(403, { error: '仅允许本机访问' });
          const url = new URL(req.url, 'http://' + host);
          if (req.method === 'GET' && url.pathname === '/posts')
            return send(200, await readPosts(postsDirectory, { drafts: true, base }));
          if (req.method !== 'POST') return send(404, { error: '接口不存在' });
          if (
            req.headers.origin !== 'http://' + host ||
            req.headers['x-blog-editor'] !== '1' ||
            !req.headers['content-type']?.startsWith('application/json')
          )
            return send(403, { error: '拒绝非本地写作页请求' });
          let raw = '',
            size = 0;
          for await (const chunk of req) {
            size += chunk.length;
            if (size > 2 * 1024 * 1024) return send(413, { error: '文章不能超过 2 MB' });
            raw += chunk;
          }
          const data = JSON.parse(raw);
          if (url.pathname === '/preview') return send(200, renderMarkdown(data.body || '', base));
          if (url.pathname === '/import') {
            if (typeof data.raw !== 'string') throw new Error('请选择 Markdown 文件');
            return send(200, parsePost(data.raw, data.slug));
          }
          if (url.pathname === '/posts') {
            // Serialize writes so revision checks and rename cannot race in this server.
            const task = queue.then(() => savePost(postsDirectory, data));
            queue = task.catch(() => {});
            return send(200, await task);
          }
          send(404, { error: '接口不存在' });
        } catch (e) {
          send(400, { error: e.message || '操作失败' });
        }
      });
    },
    async generateBundle() {
      // RSS is optional until the final public origin is configured.
      const origin = process.env.SITE_URL;
      if (!origin) return;
      const posts = await readPosts(postsDirectory, { base });
      const config = JSON.parse(await fs.readFile(path.join(root, 'config/site.json'), 'utf8'));
      const xml = (s) =>
        String(s).replace(
          /[<>&"']/g,
          (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;' })[c],
        );
      const site = origin.replace(/\/$/, '') + base;
      const items = posts
        .map(
          (p) =>
            `<item><title>${xml(p.title)}</title><link>${xml(site + '#/posts/' + p.slug)}</link><guid>${xml(site + '#/posts/' + p.slug)}</guid><pubDate>${new Date(p.date).toUTCString()}</pubDate><description>${xml(p.summary)}</description></item>`,
        )
        .join('');
      this.emitFile({
        type: 'asset',
        fileName: 'rss.xml',
        source: `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${xml(config.title)}</title><link>${xml(site)}</link><description>${xml(config.description)}</description>${items}</channel></rss>`,
      });
    },
  };
}
