import { Link, useNavigate } from 'react-router-dom'

/* 「返回」类链接的智能后退：
   历史栈里有上一页（站内点进来的）就走 navigate(-1)，
   配合 App 的滚动管理器能把来源页恢复到你离开时的位置；
   直接输入网址 / 新标签打开时历史栈为空，退化为普通链接。
   button 与 Link 共用同一套外观样式，组件内部处理元素差异。 */
export function BackLink({ to, state, className, children, ...rest }) {
  const navigate = useNavigate()
  const canGoBack = typeof window !== 'undefined' && (window.history.state?.idx ?? 0) > 0

  if (canGoBack) {
    return (
      <button type="button" className={className} onClick={() => navigate(-1)} {...rest}>
        {children}
      </button>
    )
  }
  return (
    <Link to={to} state={state} className={className} {...rest}>
      {children}
    </Link>
  )
}
