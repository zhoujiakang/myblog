import { PageHead } from './shared/PageHead'
import { ListCard, ListRow } from './shared/ListCard'
import { EmptyState } from '../components/EmptyState'
import { copy, t } from '../data/site'
import { posts, postCount } from '../lib/posts'

/* 文章列表页 —— 也被标签筛选复用（传入 list 与 desc） */

export function PostsPage({ title = copy.posts.title, desc, list, nav, context }) {
  const items = list ?? posts

  return (
    <>
      <PageHead
        title={title}
        desc={desc ?? t(copy.posts.desc, { count: postCount })}
      />
      <div className="list-wrap">
        {items.length > 0 ? (
          items.map((post) => (
            <ListRow key={post.slug}>
              <ListCard post={post} meta={post.tags ?? []} nav={nav} context={context} />
            </ListRow>
          ))
        ) : (
          <EmptyState text={copy.empty.posts} />
        )}
      </div>
    </>
  )
}
