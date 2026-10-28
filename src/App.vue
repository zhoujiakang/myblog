<script setup lang="ts">
import { watch } from 'vue';
import { useRoute } from 'vue-router';
import SiteHeader from './components/SiteHeader.vue';
import SiteFooter from './components/SiteFooter.vue';
import { site, posts } from './composables/useBlog';
const route = useRoute();
watch(
  () => [route.fullPath, route.meta.title, posts.value],
  () => {
    const title = route.params.slug
      ? posts.value.find((p) => p.slug === route.params.slug)?.title
      : route.meta.title;
    document.title = `${title || '文章不存在'} · ${site.title}`;
  },
  { immediate: true },
);
</script>
<template><SiteHeader /><RouterView /><SiteFooter /></template>
