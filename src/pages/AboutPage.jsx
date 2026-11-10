import { useEffect, useRef, useState } from 'react'
import { PageHead } from './shared/PageHead'
import { InlineText } from '../components/InlineText'
import { asset, copy, site } from '../data/site'

/* 关于页 —— 桌面仍是左右双列（名片 + 自我介绍），手机端收成一组切换：
   同一时间只显示一块，不必一屏刷过整张档案卡再刷几段正文。
   两块内容始终都在 DOM 里，显隐交给 CSS，桌面稿完全不受切换状态影响。
   文案在 content/site/copy.json，个人信息在 profile.json。 */

const PANELS = [
  { key: 'card', label: copy.about.tabCard },
  { key: 'text', label: copy.about.tabText },
]

export function AboutPage() {
  const [copied, setCopied] = useState(null)
  const [active, setActive] = useState('card')
  const timer = useRef(null)
  const tabRefs = useRef({})

  useEffect(() => () => clearTimeout(timer.current), [])

  const copyValue = (key, value) => {
    navigator.clipboard?.writeText(value).catch(() => {})
    setCopied(key)
    clearTimeout(timer.current)
    timer.current = setTimeout(() => setCopied(null), 1500)
  }

  const onTabKeyDown = (e, key) => {
    const keys = ['ArrowLeft', 'ArrowRight', 'Home', 'End']
    if (!keys.includes(e.key)) return
    e.preventDefault()
    const i = PANELS.findIndex((p) => p.key === key)
    const next =
      e.key === 'Home'
        ? 0
        : e.key === 'End'
          ? PANELS.length - 1
          : (i + (e.key === 'ArrowRight' ? 1 : -1) + PANELS.length) % PANELS.length
    const target = PANELS[next].key
    setActive(target)
    tabRefs.current[target]?.focus()
  }

  return (
    <>
      <PageHead title={copy.about.title} />

      <div className="list-wrap">
        <div className="about-tabs" role="tablist" aria-label={copy.about.tabsLabel}>
          {PANELS.map(({ key, label }) => (
            <button
              key={key}
              ref={(el) => {
                tabRefs.current[key] = el
              }}
              type="button"
              role="tab"
              id={`about-tab-${key}`}
              aria-controls={`about-panel-${key}`}
              aria-selected={active === key}
              tabIndex={active === key ? 0 : -1}
              className={active === key ? 'about-tab about-tab--active' : 'about-tab'}
              onClick={() => setActive(key)}
              onKeyDown={(e) => onTabKeyDown(e, key)}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="about-grid" data-tab={active}>
          <div
            className="about-card"
            id="about-panel-card"
            role="tabpanel"
            aria-labelledby="about-tab-card"
          >
            <img className="about-avatar" src={asset(site.avatar)} alt={site.avatarAlt} />
            <h2 className="about-name display">{site.name}</h2>
            <p className="about-role">{site.role}</p>
            <div className="about-contact-list">
              {Object.entries(site.contact).map(([label, value]) => (
                <button
                  key={label}
                  type="button"
                  className="contact-row"
                  onClick={() => copyValue(label, value)}
                >
                  <span className="contact-label">{label}</span>
                  <span className="contact-value">{value}</span>
                  <span className={copied === label ? 'contact-copied show' : 'contact-copied'}>
                    {copy.about.copied}
                  </span>
                </button>
              ))}
            </div>
            <p className="about-copy-hint">{copy.about.copyHint}</p>
          </div>

          <div
            className="about-text"
            id="about-panel-text"
            role="tabpanel"
            aria-labelledby="about-tab-text"
          >
            {site.about.map((paragraph, i) => (
              <p key={i}>
                <InlineText text={paragraph} />
              </p>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}
