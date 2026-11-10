import { Link } from 'react-router-dom'
import { copy, site, t } from '../data/site'

/** 分类 / 标签胶囊 —— 画布 2:44 / 2:68 / 2:213 等处 */
export function Pill({ tone = 'blue', size = 'md', to, children, className = '' }) {
  const cls = [
    'pill',
    `pill--${tone}`,
    size === 'sm' ? 'pill--sm' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ')

  const body = <span className="pill-text">{children}</span>

  if (to) {
    return (
      <Link to={to} className={cls}>
        {body}
      </Link>
    )
  }
  return <span className={cls}>{body}</span>
}

/** 区块标题行：色块 + 大标题 + 右侧说明。
 *  传了 noteTo 就把「全部 →」渲染成真链接，手机端也能点。 */
export function SectionTitle({ dot = 'blue', title, note, noteTo }) {
  return (
    <div className="section-title-row">
      <div className="section-title-left">
        <span className={`section-dot section-dot--${dot}`} />
        <h2 className="section-title display">{title}</h2>
      </div>
      {note ? (
        noteTo ? (
          <Link className="section-note row-all" to={noteTo}>
            {note}
          </Link>
        ) : (
          <span className="section-note">{note}</span>
        )
      ) : null}
    </div>
  )
}

/** 联系卡 —— 桌面与手机两份版式，文案都来自 copy.json */
export function ContactCard({ mobile = false }) {
  /* 渠道名由 profile.json 的 contact 键派生，换联系方式不用改文案 */
  const vars = { channels: Object.keys(site.contact).join('、') }

  if (mobile) {
    return (
      <div className="contact-card contact-card--mobile">
        <h2 className="contact-title display">{copy.contact.title}</h2>
        <p className="contact-desc">
          {t(copy.contact.mobileBefore, vars)}
          <Link to="/about">{copy.contact.mobileLink}</Link>
          {copy.contact.mobileAfter}
        </p>
      </div>
    )
  }

  return (
    <div className="contact-card">
      <div className="contact-left">
        <h2 className="contact-title display">{copy.contact.title}</h2>
        <p className="contact-desc">{t(copy.contact.desc, vars)}</p>
      </div>
      <div className="contact-right">
        <Link className="btn btn--primary" to="/about">
          {copy.contact.button}
        </Link>
      </div>
    </div>
  )
}
