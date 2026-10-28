<script setup lang="ts">
import { site, posts } from '../composables/useBlog';
</script>
<template>
  <main class="wrap">
    <section class="hero">
      <div>
        <p class="eyebrow">{{ site.eyebrow }}</p>
        <h1>
          {{ site.headline }}<br /><em>{{ site.headlineEmphasis }}</em>
        </h1>
        <p class="lead">{{ site.description }}</p>
        <div class="hero-actions">
          <RouterLink class="btn btn-primary" to="/articles">读文章</RouterLink
          ><RouterLink class="btn btn-ghost" to="/about">关于我</RouterLink>
        </div>
      </div>
      <figure class="cover" aria-label="站点封面">
        <span class="frame"></span><span class="mark">{{ site.avatar }}</span>
        <figcaption class="cap">
          <strong>{{ site.title }}</strong
          >{{ site.subtitle }}
        </figcaption>
      </figure>
    </section>
    <section style="padding-bottom: 72px">
      <div class="section-head">
        <h2>最近写的</h2>
        <RouterLink class="more" to="/articles">全部 {{ posts.length }} 篇 →</RouterLink>
      </div>
      <div class="rows">
        <RouterLink
          v-for="p in posts.slice(0, 3)"
          :key="p.slug"
          class="row"
          :to="{ path: `/posts/${p.slug}`, query: { returnTo: '/' } }"
          ><h3 class="row-title">{{ p.title }}</h3>
          <p class="row-excerpt">{{ p.summary }}</p>
          <div class="row-foot">
            <span class="meta"
              ><span class="group">{{ p.group }}</span
              ><span class="dot"></span>{{ p.date }}<span class="dot"></span
              >{{ p.minutes }} min</span
            >
          </div></RouterLink
        >
        <p v-if="!posts.length" class="muted">还没有发布文章，本地启动后可以进入写作页创建。</p>
      </div>
    </section>
  </main>
</template>
