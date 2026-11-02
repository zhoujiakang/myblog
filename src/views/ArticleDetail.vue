<template>
  <DetailShell
    v-if="item"
    back-to="/articles"
    back-label="返回文章"
    :kicker="kicker"
    :title="item.title"
    :lead="item.excerpt"
    :body="item.body"
    cta-text="想就这个话题多聊聊？"
  />
  <NotFound v-else back-to="/articles" back-label="返回文章" />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DetailShell from '../components/DetailShell.vue'
import NotFound from '../components/NotFound.vue'
import { getArticle } from '../content'

const route = useRoute()
const item = computed(() => getArticle(route.params.slug))
const kicker = computed(() => {
  if (!item.value) return ''
  return [item.value.date, item.value.tag].filter(Boolean).join('  ·  ')
})
</script>
