<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import { posts, groups, tags } from '../composables/useBlog';
import ArticleBanner from '../components/ArticleBanner.vue';
import BlogSidebar from '../components/BlogSidebar.vue';
const route = useRoute(),
  isTags = computed(() => route.path === '/tags');
</script>
<template>
  <ArticleBanner
    :title="isTags ? '全部标签' : '全部分类'"
    :kicker="isTags ? 'Index · Tags' : 'Index · Categories'"
    :meta="
      isTags
        ? `${tags.length} 个标签 / 覆盖 ${posts.length} 篇文章`
        : `${groups.length} 个分类 / 覆盖 ${posts.length} 篇文章 / 更新至 ${posts[0]?.date || '暂无文章'}`
    "
  />
  <main class="wrap cols">
    <div class="col-main">
      <div class="list-head">
        <span class="lh-label">{{ isTags ? '标签' : '分类' }}</span
        ><span class="lh-rule"></span
        ><span class="lh-count"
          ><b>{{ isTags ? tags.length : groups.length }}</b> 个</span
        >
      </div>
      <template v-if="isTags"
        ><div class="cloud-panel">
          <div class="cloud cloud-page">
            <RouterLink
              v-for="t in tags"
              :key="t.name"
              class="cloud-tag"
              :data-tier="t.tier"
              :title="`${t.count} 篇文章`"
              :to="{ path: '/articles', query: { tag: t.name } }"
              >{{ t.name }}</RouterLink
            >
            <p v-if="!tags.length">还没有标签。</p>
          </div>
        </div>
        <p class="cloud-hint">点一个词，看这个标签下的文章；字号大小对应文章多少。</p></template
      >
      <div v-else class="catlist">
        <RouterLink
          v-for="(g, i) in groups"
          :key="g.slug"
          class="cl-row"
          :to="{ path: '/articles', query: { cat: g.slug } }"
          ><span class="cl-idx">{{ String(i + 1).padStart(2, '0') }}</span
          ><span class="cl-name">{{ g.name }}</span
          ><span class="cl-n">{{ g.count }} 篇</span
          ><span class="cl-span">{{
            g.count ? `${g.earliest.slice(0, 7)} → ${g.latest.slice(0, 7)}` : '暂无文章'
          }}</span
          ><span class="cl-arrow" aria-hidden="true">→</span></RouterLink
        >
      </div>
    </div>
    <BlogSidebar />
  </main>
</template>
