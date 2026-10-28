<script setup lang="ts">
import { useRoute } from 'vue-router';
defineProps<{ title: string; kicker: string; meta: string }>();
const route = useRoute();
</script>
<template>
  <section class="banner">
    <span class="banner-grain" aria-hidden="true"></span>
    <div class="wrap banner-inner">
      <p class="banner-kicker">{{ kicker }}</p>
      <h1>{{ title }}</h1>
      <p class="banner-meta">{{ meta }}</p>
    </div>
  </section>
  <nav class="subnav" aria-label="文章区">
    <div class="wrap">
      <RouterLink
        v-for="[path, label] in [
          ['/articles', '全部文章'],
          ['/categories', '分类'],
          ['/tags', '标签'],
        ]"
        :key="path"
        :to="path"
        :aria-current="route.path === path ? 'page' : undefined"
        >{{ label }}</RouterLink
      >
    </div>
  </nav>
</template>
