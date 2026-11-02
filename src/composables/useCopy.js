import { ref, onUnmounted } from 'vue'

// 写入剪贴板；非安全上下文（如局域网 IP 预览）自动降级到 execCommand
export async function writeClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    const ta = document.createElement('textarea')
    ta.value = text
    ta.style.position = 'fixed'
    ta.style.opacity = '0'
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    ta.remove()
  }
}

// 通用复制状态：返回「当前已复制的标识」ref 与触发函数。
// 用法：trigger(key, value) —— 复制 value，并把 copiedKey 置为 key 持续 resetMs 后归零。
export function useCopy(resetMs = 1600) {
  const copiedKey = ref('')
  let timer = null

  function trigger(key, value) {
    writeClipboard(value)
    copiedKey.value = key
    clearTimeout(timer)
    timer = setTimeout(() => (copiedKey.value = ''), resetMs)
  }

  onUnmounted(() => clearTimeout(timer))

  return { copiedKey, trigger }
}
