<template>
  <span class="copy-btn-wrap">
    <button class="btn copy-btn" type="button" @click="copy">
      {{ copied ? '已复制 ✓' : site.copyBtn }}
    </button>
    <transition name="tip">
      <span v-if="copied" class="tip" aria-live="polite">{{ tipText }}</span>
    </transition>
  </span>
</template>

<script setup>
import { computed } from 'vue'
import { site } from '../content'
import { useCopy } from '../composables/useCopy'

const email = site.email
const { copiedKey, trigger } = useCopy()
const copied = computed(() => copiedKey.value === 'email')
const tipText = computed(() => (site.copyTip || '').replace('{email}', email))

function copy() {
  trigger('email', email)
}
</script>

<style scoped>
.copy-btn-wrap {
  position: relative;
  display: inline-block;
}

.copy-btn {
  border: 0;
  cursor: pointer;
}

/* 复制成功的小气泡 */
.tip {
  position: absolute;
  left: 50%;
  bottom: calc(100% + 10px);
  transform: translateX(-50%);
  padding: 6px 12px;
  border-radius: 8px;
  background: var(--ink);
  color: var(--bg);
  font-family: var(--font-mono);
  font-size: 12px;
  white-space: nowrap;
  pointer-events: none;
  box-shadow: 0 4px 14px rgba(34, 34, 32, 0.18);
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
</style>
