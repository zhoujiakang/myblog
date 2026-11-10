import { Link } from 'react-router-dom'

/* 关于页正文存在 profile.json 里，是纯文本；
   这里只解析两种极简标记，让数据文件仍然好读好改：
     **加粗**            -> <b>
     [文字](/路径)       -> 站内链接
   其余字符原样输出，不引入 markdown 依赖。 */
const TOKEN = /(\*\*[^*]+\*\*|\[[^\]]+\]\([^)]+\))/g

export function InlineText({ text }) {
  return String(text ?? '')
    .split(TOKEN)
    .filter(Boolean)
    .map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <b key={i}>{part.slice(2, -2)}</b>
      }
      const link = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/)
      if (link) {
        const [, label, to] = link
        return to.startsWith('/') ? (
          <Link key={i} to={to}>
            {label}
          </Link>
        ) : (
          <a key={i} href={to} target="_blank" rel="noreferrer">
            {label}
          </a>
        )
      }
      return <span key={i}>{part}</span>
    })
}
