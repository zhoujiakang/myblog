<template>
  <main class="missing">
    <div class="container">
      <p class="code">404</p>
      <h1>没有找到这一页</h1>
      <p class="hint">链接可能已失效，或者内容还在路上。</p>
      <RouterLink class="btn" :to="backTo">← {{ backLabel }}</RouterLink>
    </div>
  </main>
</template>

<script setup>
defineProps({
  backTo: { type: String, default: '/' },
  backLabel: { type: String, default: '返回首页' },
})
</script>

<style scoped>
.missing {
  min-height: 70vh;
  display: flex;
  align-items: center;
}

.container {
  text-align: center;
  margin: 0 auto;
}

.code {
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--accent);
  letter-spacing: 0.2em;
}

h1 {
  margin-top: 16px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 44px;
  color: var(--ink);
}

.hint {
  margin-top: 14px;
  color: var(--muted);
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  margin-top: 32px;
  padding: 0 24px;
  border-radius: 8px;
  background: var(--yellow);
  color: #2a2113;
  font-family: var(--font-mono);
  font-size: 15px;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
</style>
