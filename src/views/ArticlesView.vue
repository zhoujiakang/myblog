<script setup lang="ts">
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { posts, groups, tags } from '../composables/useBlog';
import ArticleBanner from '../components/ArticleBanner.vue';
import BlogSidebar from '../components/BlogSidebar.vue';
import ArticleTimeline from '../components/ArticleTimeline.vue';
const route = useRoute(),
  router = useRouter();
function set(key: string, value: string) {
  router.replace({ query: { ...route.query, [key]: value || undefined } });
}
const q = computed({ get: () => String(route.query.q || ''), set: (v) => set('q', v) });
const order = computed({
  get: () => (route.query.order === 'asc' ? 'asc' : 'desc'),
  set: (v) => set('order', v),
});
const group = computed(() => groups.value.find((g) => g.slug === route.query.cat));
const filtered = computed(() => {
  const terms = q.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);
  const list = posts.value.filter(
    (p) =>
      (!route.query.cat || p.group === (group.value?.name || route.query.cat)) &&
      (!route.query.tag || p.tags.includes(String(route.query.tag))) &&
      terms.every((t) =>
        [p.title, p.summary, p.body, p.group, ...p.tags].join(' ').toLocaleLowerCase().includes(t),
      ),
  );
  return order.value === 'asc' ? [...list].reverse() : list;
});
</script>
<template>
  <ArticleBanner
    title="全部文章"
    kicker="Archive · Articles"
    :meta="`${posts.length} 篇文章 / ${groups.length} 个分类 / ${tags.length} 个标签`"
  />
  <main class="wrap cols">
    <div class="col-main" data-list>
      <div class="search-tools">
        <label class="search-field"
          ><span class="sr-only">搜索文章全文</span
          ><svg
            width="16"
            height="16"
            viewBox="0 0 20 20"
            fill="none"
            stroke="currentColor"
            stroke-width="1.5"
          >
            <circle cx="8" cy="8" r="5.5" />
            <path d="m12 12 5 5" /></svg
          ><input
            v-model="q"
            type="search"
            placeholder="搜索标题、正文或标签…"
            aria-label="搜索文章全文" /></label
        ><select v-model="order" class="select" aria-label="时间排序">
          <option value="desc">最新在前</option>
          <option value="asc">最早在前</option>
        </select>
      </div>
      <div class="list-head">
        <span class="lh-label">时间线</span><span class="lh-rule"></span
        ><button v-if="route.query.cat" class="chip" @click="set('cat', '')">
          {{ group?.name || route.query.cat }} ×</button
        ><button v-if="route.query.tag" class="chip" @click="set('tag', '')">
          # {{ route.query.tag }} ×</button
        ><span class="lh-count" role="status"
          ><b>{{ filtered.length }}</b> 篇</span
        >
      </div>
      <ArticleTimeline v-if="filtered.length" :posts="filtered" />
      <div v-else class="empty show">
        <p class="empty-k">NO RESULTS</p>
        <h3>没有找到匹配的文章</h3>
        <p>试试其他关键词，或者 <RouterLink to="/articles">清除全部筛选</RouterLink>。</p>
      </div>
    </div>
    <BlogSidebar />
  </main>
</template>
