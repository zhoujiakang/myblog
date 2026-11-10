import { Link } from 'react-router-dom'
import { PageHead } from './shared/PageHead'
import { Pill } from '../components/Blocks'
import { EmptyState } from '../components/EmptyState'
import { config, copy, t } from '../data/site'
import { categories, postsByCategory } from '../lib/posts'

/* 分类聚合页 —— 每个分类一张「小档案」卡：
   名称 + 篇数 + 最新一篇 + 高频标签，按篇数从多到少排。 */

function topTags(list, n = config.topTagsCount) {
  const counter = new Map()
  for (const p of list) {
    for (const t of p.tags ?? []) {
      counter.set(t, (counter.get(t) ?? 0) + 1)
    }
  }
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([t]) => t)
}

export function CategoriesPage() {
  /* 篇数多的在前；同篇数时最近更新的在前 */
  const sorted = [...categories]
    .map((c) => ({ ...c, latest: postsByCategory(c.name)[0]?.datetime ?? '' }))
    .sort((a, b) => b.count - a.count || (a.latest < b.latest ? 1 : -1))

  return (
    <>
      <PageHead
        title={copy.categories.title}
        desc={t(copy.categories.desc, { count: categories.length })}
      />
      <div className="list-wrap">
        {sorted.length === 0 ? (
          <EmptyState text={copy.empty.categories} />
        ) : (
        <div className="cat-grid">
          {sorted.map((c) => {
            const list = postsByCategory(c.name)
            const latest = list[0]
            const tags = topTags(list)
            return (
              <Link
                key={c.name}
                className={`cat-card cat-card--${c.tone}`}
                to={`/categories/${c.name}`}
              >
                <div className="cat-card-head">
                  <h2 className="cat-card-name">{c.name}</h2>
                  <b className="cat-card-count">
                    {c.count}
                    <span>{copy.categories.countUnit}</span>
                  </b>
                </div>
                {latest && (
                  <p className="cat-card-latest">
                    {t(copy.categories.latest, { title: latest.title })}
                  </p>
                )}
                {tags.length > 0 && (
                  <div className="cat-card-tags">
                    {tags.map((t) => (
                      <Pill key={t} tone="plain" size="sm">
                        {t}
                      </Pill>
                    ))}
                  </div>
                )}
                <span className="cat-card-more">{copy.categories.more}</span>
              </Link>
            )
          })}
        </div>
        )}
      </div>
    </>
  )
}
