<template>
  <DetailShell
    v-if="item"
    back-to="/works"
    back-label="返回作品"
    :kicker="item.tags"
    :title="item.title"
    :lead="item.desc"
    :meta="meta"
    :body="item.body"
    cta-text="对这个项目感兴趣，或想一起做点什么？"
  />
  <NotFound v-else back-to="/works" back-label="返回作品" />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DetailShell from '../components/DetailShell.vue'
import NotFound from '../components/NotFound.vue'
import { getWork } from '../content'

const route = useRoute()
const item = computed(() => getWork(route.params.slug))

const meta = computed(() => {
  if (!item.value) return []
  const m = []
  if (item.value.role) m.push({ label: '角色', value: item.value.role })
  if (item.value.year) m.push({ label: '年份', value: item.value.year })
  if (item.value.stack) m.push({ label: '技术栈', value: item.value.stack })
  if (item.value.link) m.push({ label: '链接', value: item.value.link })
  return m
})
</script>
