import { PageHead } from './shared/PageHead'
import { ListCard, ListRow } from './shared/ListCard'
import { copy, t } from '../data/site'
import { categories, posts, postsByCategory } from '../lib/posts'

/* 单个分类下的全部文章 */

export function CategoryDetail({ name }) {
  const category = categories.find((c) => c.name === name) ?? categories[0]
  const list = category ? postsByCategory(category.name) : []
  const shown = list.length ? list : posts.slice(0, 3)

  return (
    <>
      <PageHead
        title={category?.name ?? name}
        desc={t(copy.categories.detailDesc, {
          count: list.length,
          name: category?.name ?? name,
        })}
      />
      <div className="list-wrap">
        {shown.map((post) => (
          <ListRow key={post.slug}>
            <ListCard
              post={post}
              meta={`${post.date} · ${post.reading}`}
              nav="/categories"
              context={{ type: 'category', name: category.name }}
            />
          </ListRow>
        ))}
      </div>
    </>
  )
}
