<template>
  <main>
    <PageHeader
      :label="site.skillsLabel"
      :title="site.skillsTitle"
      :intro="site.skillsIntro"
    />

    <section class="container">
      <div class="blocks" v-if="skills.length">
        <RouterLink
          class="card block"
          v-for="(b, i) in skills"
          :key="b.slug"
          :to="`/skills/${b.slug}`"
          v-reveal="i * 80"
        >
          <h3>{{ b.title }}</h3>
          <p>{{ b.content }}</p>
        </RouterLink>
      </div>

      <EmptyState
        v-else
        :label="site.emptySkillsLabel"
        :title="site.emptySkillsTitle"
        :text="site.emptySkillsText"
      />
    </section>

    <SiteFooter />
  </main>
</template>

<script setup>
import PageHeader from '../components/PageHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
import EmptyState from '../components/EmptyState.vue'
import { skills, site } from '../content'
</script>

<style scoped>
.blocks {
  margin-top: 60px;
  display: grid;
  gap: 30px;
}

.block {
  padding: 32px;
  min-height: 210px;
  cursor: pointer;
  text-decoration: none;
  transition: transform 0.15s ease, box-shadow 0.15s ease;
}

.block:hover {
  transform: translateY(-4px);
  box-shadow: var(--shadow-lift);
}

.block h3 {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 22px;
}

.block p {
  margin-top: 24px;
  font-family: var(--font-mono);
  font-size: 15px;
  line-height: 1.8;
  color: var(--accent);
}

@media (max-width: 640px) {
  .block {
    min-height: 0;
  }
}
</style>
