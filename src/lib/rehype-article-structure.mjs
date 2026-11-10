/**
 * 构建期把 markdown 结构翻译成设计稿的类名，并顺带产出文章目录。
 *
 * 原来正文是 site.js 里的 blocks 数组，逐块手写 type 和 class；
 * 换成 markdown 后元素由 remark 生成，这里在 AST 层面做同样的翻译，
 * 保证渲染出的 DOM 结构与原稿一致、且完全确定（不依赖渲染期计数）。
 *
 * 处理内容：
 *   - h2            -> 加 id="section-N"，包进 div.article-subtitle（内含色点）
 *   - h3            -> article-subheading（不进目录，仅做层级排版）
 *   - p             -> article-lead（首段）/ article-caption（图注）/ article-paragraph
 *   - 独占一行的 img -> figure.article-figure > img
 *   - li            -> article-list-item
 *   - blockquote    -> article-quote
 *   - pre           -> article-code
 *
 * 目录（toc）也在这里一并抽出：以 export const toc = [...] 的形式导出，
 * 数据层直接读取，不再需要单独拿原文解析一遍。
 */

/** 小节色点：蓝、黄交替 */
const DOT_TONES = ['blue', 'yellow']

/** 判断一个 p 是否为「图注」：以「图 01」样式开头，且整段较短 */
function isCaption(node) {
  const text = (node.children ?? [])
    .map((c) => c.value ?? '')
    .join('')
    .trim()
  return /^图\s*\d/.test(text) && text.length < 60
}

/** p 里是否只有一个 img */
function isImageOnly(node) {
  return (
    node.type === 'element' &&
    node.tagName === 'p' &&
    node.children?.length === 1 &&
    node.children[0].type === 'element' &&
    node.children[0].tagName === 'img'
  )
}

export default function rehypeArticleStructure() {
  return (tree, file) => {
    let sectionIndex = 0
    let paragraphIndex = 0

    /* 自底向上：先处理子节点，再处理自身。
       转换 h2 时会把它包进一个新的 div，这个 div 不再回访，
       因此不会出现自引用导致的无限递归。 */
    const transform = (node) => {
      if (node.children) {
        node.children = node.children.map(transform)
      }

      /* --- p：按顺序判定 lead / caption / paragraph --- */
      if (node.type === 'element' && node.tagName === 'p') {
        // 独占一行的图片 -> figure.article-figure
        if (isImageOnly(node)) {
          const img = node.children[0]
          paragraphIndex += 1
          return {
            type: 'element',
            tagName: 'figure',
            properties: { className: ['article-figure'] },
            children: [img],
          }
        }

        const cls = isCaption(node)
          ? 'article-caption'
          : paragraphIndex === 0
            ? 'article-lead'
            : 'article-paragraph'

        node.properties = node.properties ?? {}
        node.properties.className = [cls]
        paragraphIndex += 1
        return node
      }

      /* --- h2：编号 + 色点包裹 + 收进目录 --- */
      if (node.type === 'element' && node.tagName === 'h2') {
        const tone = DOT_TONES[sectionIndex % DOT_TONES.length]
        const id = `section-${sectionIndex}`
        sectionIndex += 1

        // 标题文字：取出纯文本（目录由 remarkArticleToc 负责）
        node.properties = node.properties ?? {}
        node.properties.id = id
        node.properties.className = ['article-subtitle-text']

        return {
          type: 'element',
          tagName: 'div',
          properties: { className: ['article-subtitle'] },
          children: [
            {
              type: 'element',
              tagName: 'span',
              properties: {
                className: ['article-subtitle-dot', `article-subtitle-dot--${tone}`],
              },
              children: [],
            },
            node,
          ],
        }
      }

      /* --- h3：小节内的三级标题 ---
         不进目录（目录只收 h2），也不带色点，
         只作为一段小标题排版，跟正文的层级区分开。 */
      if (node.type === 'element' && node.tagName === 'h3') {
        node.properties = node.properties ?? {}
        node.properties.className = ['article-subheading']
        return node
      }

      /* --- table：包一层可横向滚动的容器，窄屏不会撑破页面 --- */
      if (node.type === 'element' && node.tagName === 'table') {
        return {
          type: 'element',
          tagName: 'div',
          properties: { className: ['article-table-wrap'] },
          children: [node],
        }
      }

      /* --- li / blockquote / pre --- */
      if (node.type === 'element' && node.tagName === 'li') {
        node.properties = node.properties ?? {}
        node.properties.className = ['article-list-item']
        return node
      }

      if (node.type === 'element' && node.tagName === 'blockquote') {
        node.properties = node.properties ?? {}
        node.properties.className = ['article-quote']
        return node
      }

      if (node.type === 'element' && node.tagName === 'pre') {
        node.properties = node.properties ?? {}
        node.properties.className = ['article-code']
        return node
      }

      return node
    }

    tree.children = tree.children.map(transform)
  }
}
