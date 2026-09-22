'use strict'

hexo.extend.generator.register('empty-home', locals => {
  if (locals.posts.length > 0) return []

  return {
    path: 'index.html',
    layout: ['index', 'archive'],
    data: {
      __index: true,
      posts: locals.posts,
      current: 1,
      total: 1,
      prev: 0,
      next: 0,
      prev_link: '',
      next_link: ''
    }
  }
})
