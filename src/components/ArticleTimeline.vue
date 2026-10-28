<script setup lang="ts">
import { computed } from 'vue';
import { useRoute } from 'vue-router';
import type { Post } from '../types/blog';
const props = defineProps<{ posts: Post[] }>(),
  route = useRoute();
const entries = computed(() => {
  let year = '';
  return props.posts.map((post, index) => {
    const current = post.date.slice(0, 4),
      showYear = year !== current;
    year = current;
    return { post, index, year: current, showYear };
  });
});
</script>
<template>
  <div class="timeline" data-timeline>
    <template v-for="{ post, index, year, showYear } in entries" :key="post.slug"
      ><div v-if="showYear" class="tl-year">
        <span class="ring"></span><span class="label">{{ year }}</span>
      </div>
      <RouterLink
        class="tl-item"
        :to="{ path: `/posts/${post.slug}`, query: { returnTo: route.fullPath } }"
        ><span class="node"></span
        ><span class="tl-thumb" :data-idx="String(index + 1).padStart(2, '0')"></span
        ><span class="tl-body"
          ><span class="tl-meta"
            ><span class="tl-group">{{ post.group }}</span> · {{ post.date }} ·
            {{ post.minutes }} min</span
          ><span class="tl-title">{{ post.title }}</span></span
        ></RouterLink
      ></template
    >
  </div>
</template>
