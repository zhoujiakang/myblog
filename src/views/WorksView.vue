<template>
  <main>
    <PageHeader :label="site.worksLabel" :title="site.worksTitle" :intro="site.worksIntro" />

    <section class="container">
      <div class="grid" v-if="works.length">
        <RouterLink
          class="card item"
          v-for="(w, i) in works"
          :key="w.slug"
          :to="`/works/${w.slug}`"
          v-reveal="i * 70"
        >
          <h3>{{ w.title }}</h3>
          <p>{{ w.desc }}</p>
          <span class="tag">{{ w.tags }}</span>
        </RouterLink>
      </div>

      <EmptyState
        v-else
        :label="site.emptyWorksLabel"
        :title="site.emptyWorksTitle"
        :text="site.emptyWorksText"
      />
    </section>

    <SiteFooter />
  </main>
</template>

<script setup>
import PageHeader from '../components/PageHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
import EmptyState from '../components/EmptyState.vue'
import { works, site } from '../content'
</script>

<style scoped>
.grid {
  margin-top: 60px;
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 30px;
}

.item {
  display: flex;
  flex-direction: column;
  min-height: 300px;
  padding: 28px;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.item:hover {
  transform: translateY(-4px);
  box-shadow: 0 1px 2px rgba(34, 34, 32, 0.04), 0 16px 40px rgba(34, 34, 32, 0.08);
}

.item h3 {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 22px;
}

.item p {
  margin-top: 20px;
  max-width: 350px;
  font-size: 14px;
  line-height: 1.6;
  color: var(--muted);
}

.item .tag {
  margin-top: auto;
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent);
}

@media (max-width: 1000px) {
  .grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .grid {
    grid-template-columns: 1fr;
  }
}
</style>
