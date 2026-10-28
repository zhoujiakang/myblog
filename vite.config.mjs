import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { blogPlugin } from './server/plugin.mjs';
export default defineConfig(({ mode, command }) => {
  const local = command === 'serve' && mode === 'editor';
  const base = process.env.BASE_PATH || '/';
  if (!base.startsWith('/') || !base.endsWith('/'))
    throw new Error('BASE_PATH 必须以 / 开始和结束');
  return {
    base,
    plugins: [vue(), blogPlugin({ local, base })],
    define: { __LOCAL_EDITOR__: JSON.stringify(local) },
    server: { host: '127.0.0.1', port: 5273, strictPort: true },
    build: { outDir: 'dist', emptyOutDir: true },
  };
});
