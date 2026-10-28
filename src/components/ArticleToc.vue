<script setup lang="ts">
import type { Heading } from '../types/blog';
defineProps<{ headings: Heading[]; active: string }>();
function jump(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
</script>
<template>
  <ol data-toc>
    <li v-for="h in headings" :key="h.id">
      <a
        :href="`#${h.id}`"
        :class="{ 'is-active': active === h.id }"
        :style="{ paddingLeft: `${12 + Math.max(0, h.level - 2) * 12}px` }"
        @click.prevent="jump(h.id)"
        >{{ h.text }}</a
      >
    </li>
  </ol>
</template>
