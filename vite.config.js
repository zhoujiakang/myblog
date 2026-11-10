import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import remarkGfm from 'remark-gfm'
import remarkArticleToc from './src/lib/remark-article-toc.mjs'
import rehypeArticleStructure from './src/lib/rehype-article-structure.mjs'

/* 站点元信息只在 profile.json 里维护一份；index.html 放占位符，
   dev / build 时由这个插件注入，避免搜索结果里的描述和站内人设对不上。 */
const profile = JSON.parse(
  readFileSync(fileURLToPath(new URL('./src/content/site/profile.json', import.meta.url)), 'utf8')
)
const escapeHtml = (s) =>
  String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

function siteMeta() {
  return {
    name: 'site-meta-from-profile',
    transformIndexHtml(html) {
      return html
        .replaceAll('__META_TITLE__', escapeHtml(profile.metaTitle))
        .replaceAll('__META_DESCRIPTION__', escapeHtml(profile.metaDescription))
    },
  }
}

export default defineConfig({
  plugins: [
    react(),
    siteMeta(),
    /* .md 在构建期编译成 React 组件：
       - remark-frontmatter 识别开头的 YAML front matter
       - remark-mdx-frontmatter 把它导出成 frontmatter 常量，供数据层读取
       - remarkArticleToc 从原文提取目录与字数，注入 front matter
       - remark-gfm 补上表格、删除线、任务列表等 GitHub 语法
       - rehypeArticleStructure 把生成的元素接到设计稿既有的 class 上 */
    mdx({
      remarkPlugins: [
        /* toc 插件要先跑：它在 front matter 的 yaml 节点上补字段，
           而 remark-mdx-frontmatter 随后才把该节点转成导出。 */
        remarkArticleToc,
        remarkFrontmatter,
        remarkMdxFrontmatter,
        remarkGfm,
      ],
      rehypePlugins: [rehypeArticleStructure],
    }),
  ],
  base: './',
})
