<template>
  <main>
    <PageHeader
      :label="site.articlesLabel"
      :title="site.articlesTitle"
      :intro="site.articlesIntro"
    />

    <section class="container">
      <div class="filters" v-if="allTags.length">
        <button class="chip" :class="{ active: !selectedTag }" @click="selectedTag = null">
          全部
        </button>
        <button
          class="chip"
          v-for="t in allTags"
          :key="t"
          :class="{ active: selectedTag === t }"
          @click="selectedTag = selectedTag === t ? null : t"
        >
          {{ t }}
        </button>
      </div>

      <div class="timeline" v-if="timeline.length">
        <div class="year-group" v-for="(g, gi) in timeline" :key="g.year">
          <div class="year">{{ g.year }}</div>
          <RouterLink
            class="entry"
            v-for="(a, i) in g.items"
            :key="a.slug"
            :to="`/articles/${a.slug}`"
            v-reveal="gi * 60 + i * 40"
          >
            <span class="dot"></span>
            <span class="date">{{ a.date }}</span>
            <span class="title">{{ a.title }}</span>
            <span class="tag">{{ a.tag }}</span>
          </RouterLink>
        </div>
      </div>

      <EmptyState
        v-else-if="!articles.length"
        :label="site.emptyArticlesLabel"
        :title="site.emptyArticlesTitle"
        :text="site.emptyArticlesText"
      />
      <div v-else class="tag-empty">
        <p>{{ tagEmptyText }}</p>
        <button class="chip" @click="selectedTag = null">{{ site.viewAll }}</button>
      </div>
    </section>

    <SiteFooter />
  </main>
</template>

<script setup>
import { ref, computed } from 'vue'
import PageHeader from '../components/PageHeader.vue'
import SiteFooter from '../components/SiteFooter.vue'
import EmptyState from '../components/EmptyState.vue'
import { articles, site } from '../content'

const selectedTag = ref(null)
const tagEmptyText = computed(() =>
  (site.tagEmptyText || '').replace('{tag}', selectedTag.value || '')
)
const allTags = computed(() =>
  [...new Set(articles.map((a) => a.tag).filter(Boolean))]
)
const filtered = computed(() =>
  selectedTag.value
    ? articles.filter((a) => a.tag === selectedTag.value)
    : articles
)

function yearOf(d) {
  const m = String(d || '').match(/(19|20)\d{2}/)
  return m ? m[0] : '—'
}

function sortKey(d) {
  const s = String(d || '')
  const m = s.match(/(19|20)\d{2}(?:[.\-/](\d{1,2}))?(?:[.\-/](\d{1,2}))?/)
  if (!m) return 0
  return +m[1] * 10000 + (m[2] ? +m[2] : 12) * 100 + (m[3] ? +m[3] : 31)
}

const timeline = computed(() => {
  const groups = {}
  for (const a of filtered.value) {
    const y = yearOf(a.date)
    ;(groups[y] ||= []).push(a)
  }
  return Object.keys(groups)
    .sort((a, b) => (b === '—' ? 0 : +b) - (a === '—' ? 0 : +a))
    .map((year) => ({
      year,
      items: groups[year]
        .slice()
        .sort((x, y) => sortKey(y.date) - sortKey(x.date)),
    }))
})
</script>

<style scoped>
.filters {
  margin-top: 48px;
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.chip {
  font-family: var(--font-mono);
  font-size: 13px;
  padding: 7px 15px;
  border-radius: 999px;
  border: 1px solid rgba(34, 34, 32, 0.14);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  transition: all 0.18s ease;
}

.chip:hover {
  color: var(--ink);
  border-color: rgba(34, 34, 32, 0.32);
}

.chip.active {
  background: var(--accent);
  border-color: var(--accent);
  color: #fff;
}

.timeline {
  margin-top: 38px;
  padding-left: 26px;
  position: relative;
}

.timeline::before {
  content: '';
  position: absolute;
  left: 7px;
  top: 10px;
  bottom: 10px;
  width: 2px;
  background: rgba(34, 34, 32, 0.1);
}

.year-group {
  margin-bottom: 34px;
}

.year {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 28px;
  color: var(--faint);
  margin-bottom: 12px;
}

.entry {
  display: grid;
  grid-template-columns: 96px 1fr auto;
  align-items: baseline;
  gap: 16px;
  position: relative;
  padding: 13px 0;
  text-decoration: none;
  color: inherit;
  border-bottom: 1px solid rgba(34, 34, 32, 0.06);
}

.entry .dot {
  position: absolute;
  left: -23px;
  top: 19px;
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--bg);
  border: 2px solid var(--accent);
}

.entry:hover .title {
  color: var(--accent);
}

.entry .date {
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--faint);
}

.entry .title {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 17px;
  color: var(--ink);
  transition: color 0.15s ease;
}

.entry .tag {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--accent);
  text-align: right;
}

.tag-empty {
  margin-top: 70px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 20px;
  text-align: center;
  font-size: 15px;
  color: var(--muted);
}

@media (max-width: 640px) {
  .entry {
    grid-template-columns: 1fr;
    gap: 4px;
  }
  .entry .dot {
    display: none;
  }
  .entry .tag {
    text-align: left;
  }
  .timeline {
    padding-left: 16px;
  }
  .timeline::before {
    left: 3px;
  }
}
</style>
