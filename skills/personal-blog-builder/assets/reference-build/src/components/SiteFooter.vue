<template>
  <footer class="footer">
    <div class="container">
      <div class="line"></div>
      <div class="row">
        <div class="links">
          <a :href="site.github" target="_blank" rel="noopener">GitHub</a>
          <span v-for="c in copyItems" :key="c.key" class="clip-wrap">
            <button
              class="clip"
              type="button"
              :title="`点击复制 / Click to copy`"
              @click="copyText(c)"
            >
              {{ c.label }}
            </button>
            <transition name="tip">
              <span v-if="copiedKey === c.key" class="tip" aria-live="polite">已复制 ✓</span>
            </transition>
          </span>
        </div>
        <p class="copy">{{ site.copyright }}</p>
      </div>
      <img class="dog" :src="dogImg" alt="" />
    </div>
  </footer>
</template>

<script setup>
import dogImg from '../assets/dog.png'
import { site } from '../content'
import { useCopy } from '../composables/useCopy'

// 只展示方式名，点击复制对应号码 / 地址
const copyItems = [
  { key: 'email', label: 'Email', value: site.email },
  { key: 'phone', label: 'Phone', value: site.phone },
  { key: 'qq', label: 'QQ', value: site.qq },
]

const { copiedKey, trigger } = useCopy()

function copyText(item) {
  trigger(item.key, item.value)
}
</script>

<style scoped>
.footer {
  position: relative;
  margin-top: 90px;
  padding-bottom: 40px;
}

.line {
  height: 1px;
  background: var(--line);
}

.row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: 16px;
  padding: 30px 140px 0 0;
}

.links {
  display: flex;
  flex-wrap: wrap;
  gap: 16px 40px;
  font-family: var(--font-mono);
  font-size: 14px;
  color: var(--muted);
}

.links > * {
  white-space: nowrap;
}

.links a:hover {
  color: var(--accent);
}

.links .clip-wrap {
  position: relative;
}

.links .clip {
  padding: 0;
  border: 0;
  background: none;
  font: inherit;
  color: inherit;
  cursor: pointer;
  transition: color 0.18s ease;
}

.links .clip:hover,
.links .clip:active {
  color: var(--accent);
}

/* 复制成功的小气泡 */
.tip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  transform: translateX(-50%);
  padding: 6px 12px;
  border-radius: var(--radius-btn);
  background: var(--ink);
  color: var(--bg);
  font-family: var(--font-mono);
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: var(--shadow-pop);
  z-index: 5;
}

.tip::after {
  content: '';
  position: absolute;
  left: 50%;
  top: 100%;
  transform: translateX(-50%);
  border: 5px solid transparent;
  border-top-color: var(--ink);
}

.tip-enter-active,
.tip-leave-active {
  transition: opacity 0.18s ease, transform 0.18s ease;
}

.tip-enter-from,
.tip-leave-to {
  opacity: 0;
  transform: translateX(-50%) translateY(4px);
}

.copy {
  white-space: nowrap;
  flex-shrink: 0;
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--faint);
}

.dog {
  position: absolute;
  right: 0;
  bottom: 20px;
  width: 120px;
  height: auto;
}

@media (max-width: 700px) {
  .row {
    padding-right: 0;
    padding-bottom: 110px;
    flex-direction: column;
    align-items: flex-start;
  }
  .dog {
    width: 96px;
  }
}
</style>
