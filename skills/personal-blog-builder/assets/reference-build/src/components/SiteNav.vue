<template>
  <header class="nav">
    <div class="container nav-inner">
      <RouterLink to="/" class="logo">zzZ</RouterLink>

      <nav class="links">
        <RouterLink v-for="n in site.nav" :key="n.to" :to="n.to">{{ n.label }}</RouterLink>
      </nav>

      <div class="right">
        <a class="gh" :href="site.github" target="_blank" rel="noopener">{{ ghLabel }}</a>
      </div>
    </div>
  </header>
</template>

<script setup>
import { computed } from 'vue'
import { site } from '../content'

// GitHub 展示文字由地址自动派生，避免和配置里的链接写重
const ghLabel = computed(() => site.github.replace(/^https?:\/\//, ''))
</script>

<style scoped>
.nav {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--bg);
  padding: 26px 0;
}

.nav-inner {
  display: flex;
  align-items: center;
}

.logo {
  font-family: var(--font-mono);
  font-weight: 700;
  font-size: 16px;
  color: var(--ink);
}

.links {
  display: flex;
  gap: 48px;
  margin-left: 240px;
}

.links a {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--ink);
  transition: color 0.15s ease;
}

.links a:hover,
.links a.router-link-active {
  color: var(--accent);
}

.right {
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 24px;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--faint);
}

.gh {
  transition: color 0.15s ease;
}

.gh:hover {
  color: var(--accent);
}

@media (max-width: 1080px) {
  .links {
    margin-left: 120px;
    gap: 40px;
  }
}

@media (max-width: 720px) {
  .nav-inner {
    flex-wrap: wrap;
    gap: 14px 0;
  }
  .links {
    margin-left: 0;
    gap: 28px;
    width: 100%;
  }
  .right {
    margin-left: 0;
  }
}
</style>
