<script setup lang="ts">
import { useRoute } from 'vue-router';
import { site, posts, groups, tags } from '../composables/useBlog';
const route = useRoute();
function filter(kind: string, value: string) {
  return {
    path: '/articles',
    query: {
      ...(route.path === '/articles' ? route.query : {}),
      [kind]: route.query[kind] === value ? undefined : value,
    },
  };
}
</script>
<template>
  <aside class="col-side" aria-label="站点信息">
    <section class="side-card side-profile">
      <span class="ava" aria-hidden="true">{{ site.avatar }}</span>
      <p class="sp-name">{{ site.title }}</p>
      <p class="sp-bio">{{ site.bio }}</p>
      <ul class="sp-stats">
        <li>
          <b>{{ posts.length }}</b
          ><span>文章</span>
        </li>
        <li>
          <b>{{ tags.length }}</b
          ><span>标签</span>
        </li>
        <li>
          <b>{{ groups.length }}</b
          ><span>分类</span>
        </li>
      </ul>
      <RouterLink class="sp-btn" to="/about">关于我</RouterLink>
    </section>
    <section v-if="route.path !== '/categories'" class="side-card">
      <h2 class="sc-title">
        <span>分类</span><span class="sc-rule"></span
        ><RouterLink class="sc-all" to="/categories">全部 <i aria-hidden="true">→</i></RouterLink>
      </h2>
      <div class="sc-rows">
        <RouterLink
          v-for="g in groups.slice(0, 3)"
          :key="g.slug"
          class="sc-row"
          :to="filter('cat', g.slug)"
          :aria-current="route.query.cat === g.slug ? 'true' : undefined"
          ><span>{{ g.name }}</span
          ><b>{{ g.count }}</b></RouterLink
        >
      </div>
    </section>
    <section v-if="route.path !== '/tags'" class="side-card">
      <h2 class="sc-title">
        <span>标签</span><span class="sc-rule"></span
        ><RouterLink class="sc-all" to="/tags">全部 <i aria-hidden="true">→</i></RouterLink>
      </h2>
      <div class="cloud side-tags">
        <RouterLink
          v-for="t in tags.slice(0, 10)"
          :key="t.name"
          class="cloud-tag"
          :data-tier="t.tier"
          :data-count="t.count"
          :title="`${t.count} 篇文章`"
          :to="filter('tag', t.name)"
          :aria-current="route.query.tag === t.name ? 'true' : undefined"
          >{{ t.name }}</RouterLink
        >
        <p v-if="!tags.length">还没有标签</p>
      </div>
    </section>
  </aside>
</template>
