import { copy } from '../data/site'

/* 空状态占位卡 —— 内容清空 / 还没写第一篇时，
   列表页不再是一片空白，而是一张虚线框提示卡。
   文案在 copy.json 的 empty 段，按页面传入。 */
export function EmptyState({ text }) {
  return (
    <div className="empty-state">
      <span className="empty-state-doodle" aria-hidden="true">
        <span />
        <span />
        <span />
      </span>
      <p>{text ?? copy.empty.posts}</p>
    </div>
  )
}
