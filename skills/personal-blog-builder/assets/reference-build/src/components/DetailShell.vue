<template>
  <main class="detail">
    <div class="container">
      <RouterLink class="back" :to="backTo">← {{ backLabel }}</RouterLink>

      <p v-if="kicker" class="kicker">{{ kicker }}</p>
      <h1 class="title">{{ title }}</h1>
      <p v-if="lead" class="lead">{{ lead }}</p>

      <ul v-if="meta && meta.length" class="meta">
        <li v-for="m in meta" :key="m.label">
          <span class="m-label">{{ m.label }}</span>
          <span class="m-value">{{ m.value }}</span>
        </li>
      </ul>

      <article v-if="body" class="prose">
        <template v-for="(para, i) in paras" :key="i">
          <h2 v-if="para.h">{{ para.h }}</h2>
          <p v-else>{{ para.t }}</p>
        </template>
      </article>

      <div class="cta" v-reveal>
        <p class="cta-text">{{ ctaText }}</p>
        <CopyEmailBtn />
      </div>
    </div>

    <SiteFooter />
  </main>
</template>

<script setup>
import { computed } from 'vue'
import SiteFooter from './SiteFooter.vue'
import CopyEmailBtn from './CopyEmailBtn.vue'

const props = defineProps({
  backTo: { type: String, default: '/' },
  backLabel: { type: String, default: '返回' },
  kicker: { type: String, default: '' },
  title: { type: String, default: '' },
  lead: { type: String, default: '' },
  meta: { type: Array, default: () => [] },
  body: { type: String, default: '' },
  ctaText: { type: String, default: '想聊聊这个项目，或只是打个招呼？' },
})

// 极简正文解析：空行分段；单个 # 开头的行当作小标题
const paras = computed(() => {
  return props.body
    .split(/\n\s*\n/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((block) => {
      if (block.startsWith('# ')) return { h: block.slice(2).trim() }
      return { t: block.replace(/\n/g, ' ') }
    })
})
</script>

<style scoped>
.detail {
  padding-bottom: 20px;
}

.back {
  display: inline-block;
  margin-top: 100px;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--muted);
  transition: color 0.18s ease;
}

.back:hover {
  color: var(--accent);
}

.kicker {
  margin-top: 40px;
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.12em;
  color: var(--accent);
}

.title {
  margin-top: 14px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 52px;
  line-height: 1.1;
  color: var(--ink);
}

.lead {
  margin-top: 24px;
  max-width: 680px;
  font-size: 18px;
  line-height: 1.7;
  color: var(--muted);
}

.meta {
  margin-top: 36px;
  display: flex;
  flex-wrap: wrap;
  gap: 16px 48px;
  padding: 24px 0;
  border-top: 1px solid var(--line);
  border-bottom: 1px solid var(--line);
}

.meta li {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.m-label {
  font-family: var(--font-mono);
  font-size: 12px;
  color: var(--faint);
}

.m-value {
  font-size: 15px;
  color: var(--ink);
}

.prose {
  margin-top: 48px;
  max-width: 720px;
}

.prose h2 {
  margin: 36px 0 14px;
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 22px;
  color: var(--ink);
}

.prose h2:first-child {
  margin-top: 0;
}

.prose p {
  font-size: 16px;
  line-height: 1.85;
  color: var(--muted);
}

.cta {
  margin-top: 72px;
  display: flex;
  align-items: center;
  gap: 24px;
}

.cta-text {
  font-size: 15px;
  color: var(--muted);
}

@media (max-width: 720px) {
  .back {
    margin-top: 72px;
  }
  .title {
    font-size: 36px;
  }
  .lead {
    font-size: 16px;
  }
  .cta {
    flex-direction: column;
    align-items: flex-start;
    gap: 18px;
  }
}
</style>
