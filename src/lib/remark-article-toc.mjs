/**
 * 从 md 原文提取文章目录与真实字数，写进 front matter 的 YAML 节点。
 *
 * 为什么不单独导出：MDX 默认不导出 md 里的具名 ESM，
 * 而 front matter 已经通过 remark-mdx-frontmatter 稳定导出，
 * 所以直接复用这条通道 —— 数据层读 frontmatter.toc / .wordCount 即可。
 *
 * 目录取所有「## 标题」，顺序与 rehype 里生成的 id（section-0、section-1…）一致。
 * 字数按「中日韩汉字 + 拉丁词」统计，阅读时长由数据层按 config.wordsPerMinute 换算，
 * md 里不再手填 words / reading，永远不会和正文对不上。
 */
import { visit } from 'unist-util-visit'

/** 去掉 YAML 头、代码块、图片与链接语法，只留下用于计数的可见文字 */
function countWords(source) {
  const body = source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '')
  const plain = body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]*\)/g, ' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[#>*_`~|]/g, ' ')
  const cjk = (plain.match(/[\u3400-\u9fff\u3040-\u30ff]/g) ?? []).length
  const latin = (plain.match(/[A-Za-z0-9]+/g) ?? []).length
  return cjk + latin
}

export default function remarkArticleToc() {
  return (tree, file) => {
    const source = String(file.value ?? '')

    const toc = source
      .split('\n')
      .map((line) => line.match(/^##\s+(.+)$/))
      .filter(Boolean)
      .map((m) => m[1].trim())

    const wordCount = countWords(source)

    /* 找到 front matter 节点，在它的 yaml 里补字段。
       yaml 是字符串：先剔除手填的统计字段（防重复键），再追加自动派生的值。 */
    let patched = false
    visit(tree, 'yaml', (node) => {
      if (patched) return
      const value = String(node.value ?? '')
        .split('\n')
        .filter((line) => !/^\s*(words|reading|wordCount|readingMinutes)\s*:/.test(line))
        .join('\n')
        .trimEnd()

      const lines = [`wordCount: ${wordCount}`]
      if (toc.length) {
        lines.push('toc:', ...toc.map((item) => `  - ${JSON.stringify(item)}`))
      }
      node.value = `${value}\n${lines.join('\n')}\n`
      patched = true
    })
  }
}
