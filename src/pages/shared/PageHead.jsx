/* 页头 —— 列表页 / 分类 / 标签 / 归档 / 关于 / 404 共用的标题区 */

export function PageHead({ title, desc }) {
  return (
    <header className="page-head">
      <h1 className="page-title">{title}</h1>
      {desc ? <p className="page-desc">{desc}</p> : null}
    </header>
  )
}
