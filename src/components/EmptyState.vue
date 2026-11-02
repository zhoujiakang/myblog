<template>
  <div class="empty-state">
    <span class="kicker">{{ label }}</span>
    <h2 class="title">{{ title }}</h2>
    <p class="text">{{ text }}</p>
  </div>
</template>

<script setup>
defineProps({
  label: { type: String, default: '' },
  title: { type: String, required: true },
  text: { type: String, default: '' },
})
</script>

<style scoped>
.empty-state {
  margin-top: 90px;
  margin-bottom: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  gap: 16px;
}

.kicker {
  font-family: var(--font-mono);
  font-size: 13px;
  letter-spacing: 0.16em;
  color: var(--faint);
}

.title {
  font-family: var(--font-title);
  font-weight: 700;
  font-size: 30px;
  color: var(--ink);
  line-height: 1.3;
}

.text {
  max-width: 420px;
  font-size: 15px;
  line-height: 1.75;
  color: var(--muted);
}

@media (max-width: 640px) {
  .empty-state {
    margin-top: 60px;
  }
  .title {
    font-size: 24px;
  }
}
</style>
