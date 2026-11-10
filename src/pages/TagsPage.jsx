import { Link } from 'react-router-dom'
import { PageHead } from './shared/PageHead'
import { EmptyState } from '../components/EmptyState'
import { config, copy, t } from '../data/site'
import { tags } from '../lib/posts'

/* 标签聚合页 —— #名 大字排版，全部标签一个网格，按篇数排序 */

export function TagsPage() {
  return (
    <>
      <PageHead
        title={copy.tags.title}
        desc={t(copy.tags.desc, { count: tags.length })}
      />
      <div className="list-wrap">
        {tags.length > 0 ? (
          <div className="tag-grid">
            {tags.map((tag, i) => (
              <Link
                key={tag.name}
                className={`tag-item tag-item--${config.tagTones[i % config.tagTones.length]}`}
                to={`/tags/${tag.name}`}
              >
                <span className="tag-item-name">
                  <span className="tag-hash">{copy.tags.hash}</span>
                  {tag.name}
                </span>
                <span className="tag-item-count">
                  {t(copy.tags.countUnit, { count: tag.count })}
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <EmptyState text={copy.empty.tags} />
        )}
      </div>
    </>
  )
}
