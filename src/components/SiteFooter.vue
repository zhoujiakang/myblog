<script setup lang="ts">
import { site } from '../composables/useBlog';
</script>
<template>
  <footer class="footer">
    <div class="wrap inner">
      <span>{{ new Date().getFullYear() }} {{ site.title }} · 由 GitHub Pages 托管</span
      ><span>文章以 Markdown 存放于 Git 仓库</span>
    </div>
  </footer>
</template>
