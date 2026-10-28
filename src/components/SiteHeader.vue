<script setup lang="ts">
import { ref, watch } from 'vue';
import { useRoute } from 'vue-router';
import { site } from '../composables/useBlog';
const route = useRoute(),
  open = ref(false);
const local = __LOCAL_EDITOR__;
const themes = [
  ['a', '砚台'],
  ['b', '栅格'],
  ['c', '素墨'],
  ['d', '终端'],
  ['e', '苔痕'],
];
const theme = ref(document.documentElement.dataset.theme || 'b');
function setTheme(value: string) {
  theme.value = value;
  document.documentElement.dataset.theme = value;
  try {
    localStorage.setItem('mb-theme', value);
  } catch {}
}
watch(
  () => route.path,
  () => (open.value = false),
);
</script>
<template>
  <header class="topbar" :class="{ open }">
    <div class="wrap inner">
      <RouterLink class="brand" to="/"
        ><span class="name">{{ site.title }}</span
        ><span class="sub">/ {{ site.subtitle }}</span></RouterLink
      >
      <nav class="nav" aria-label="主导航">
        <RouterLink to="/" :aria-current="route.path === '/' ? 'page' : undefined">首页</RouterLink
        ><RouterLink
          to="/articles"
          :aria-current="
            ['/articles', '/categories', '/tags'].includes(route.path) ||
            route.path.startsWith('/posts/')
              ? 'page'
              : undefined
          "
          >文章</RouterLink
        ><RouterLink to="/about" :aria-current="route.path === '/about' ? 'page' : undefined"
          >关于</RouterLink
        >
      </nav>
      <div class="toolbar">
        <div class="theme-switch" role="group" aria-label="切换风格">
          <span class="label">风格</span
          ><button
            v-for="[value, label] in themes"
            :key="value"
            class="dot"
            :data-set="value"
            :aria-label="label"
            :aria-pressed="theme === value"
            @click="setTheme(value)"
          ></button>
        </div>
        <RouterLink v-if="local" class="write-link" to="/write">写作</RouterLink>
        <button
          class="nav-toggle"
          aria-label="展开菜单"
          :aria-expanded="open"
          @click="open = !open"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            stroke-width="1.4"
          >
            <path d="M2 4h12M2 8h12M2 12h12" />
          </svg>
        </button>
      </div>
    </div>
  </header>
</template>
