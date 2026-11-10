import { Link } from 'react-router-dom'
import { copy, site, t } from '../data/site'

/* 页脚 —— 桌面横向两端对齐 / 手机纵向堆叠，由 CSS 断点切换。
   文案在 copy.json，署名与年份取自 profile.json 与当前时间。 */
export default function Footer() {
  const year = new Date().getFullYear()
  const links = copy.footer.links

  return (
    <footer className="site-footer">
      <p className="site-footer-line">
        {t(copy.footer.copyright, { year, name: site.name })}
        <span className="only-desktop">{copy.footer.separator}</span>
        <span className="only-mobile">{copy.footer.separatorMobile}</span>
        {copy.footer.slogan}
      </p>
      <p className="site-footer-line">
        {links.map((item, i) => (
          <span key={item.to}>
            {i ? <span aria-hidden="true">{copy.footer.linkSeparator}</span> : null}
            <Link to={item.to}>{item.label}</Link>
          </span>
        ))}
      </p>
    </footer>
  )
}
