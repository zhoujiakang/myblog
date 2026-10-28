<script setup lang="ts">
import { site, posts } from '../composables/useBlog';
</script>
<template>
  <main class="wrap">
    <div class="page-head">
      <p class="eyebrow">ABOUT</p>
      <h1>关于我，和这个站</h1>
    </div>
    <div class="about-grid">
      <div>
        <p class="about-lead">{{ site.about }}</p>
        <section class="about-block">
          <h2>常用技术</h2>
          <div class="tag-cloud" style="margin: 0">
            <span v-for="skill in site.skills" :key="skill" class="tag">{{ skill }}</span>
          </div>
        </section>
        <section class="about-block">
          <h2>这个站</h2>
          <p>
            这里用来整理学习笔记、记录动手实践，也存放暂时还没想明白的问题。内容会随着学习逐步补充和修订。
          </p>
          <p>希望回头翻看时，不只记得一个结论，也能找到当时理解它的过程。</p>
        </section>
        <section v-if="site.email || site.github" class="about-block">
          <h2>联系</h2>
          <p v-if="site.email">
            <a :href="`mailto:${site.email}`">{{ site.email }}</a>
          </p>
          <p v-if="site.github">
            <a :href="site.github" target="_blank" rel="noopener noreferrer">GitHub →</a>
          </p>
        </section>
      </div>
      <aside>
        <dl class="facts">
          <div>
            <dt>作者</dt>
            <dd>{{ site.author }}</dd>
          </div>
          <div>
            <dt>当前状态</dt>
            <dd>{{ site.status }}</dd>
          </div>
          <div>
            <dt>本站文章</dt>
            <dd>{{ posts.length }} 篇</dd>
          </div>
          <div>
            <dt>更新至</dt>
            <dd>{{ posts[0]?.date || '暂无文章' }}</dd>
          </div>
          <div>
            <dt>内容格式</dt>
            <dd>Markdown</dd>
          </div>
        </dl>
      </aside>
    </div>
  </main>
</template>
