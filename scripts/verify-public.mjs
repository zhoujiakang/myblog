import fs from 'node:fs/promises';
import path from 'node:path';
const root = new URL('../dist/', import.meta.url);
async function check(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) await check(file);
    else if (/\.(js|html)$/.test(file)) {
      const text = await fs.readFile(file, 'utf8');
      for (const forbidden of [
        '/__local/',
        'LOCAL ONLY',
        'EditorView',
        '一篇尚未完成的草稿',
        '草稿加载与保存',
      ]) {
        if (text.includes(forbidden))
          throw new Error(`公开产物含本地编辑器或草稿：${entry.name} (${forbidden})`);
      }
    }
  }
}
await check(root.pathname);
console.log('公开产物检查通过：不包含本地编辑器、写作接口和演示草稿。');
