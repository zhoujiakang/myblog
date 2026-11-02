<template>
  <DetailShell
    v-if="item"
    back-to="/skills"
    back-label="返回技能"
    :kicker="item.title"
    :title="item.title"
    :lead="item.content"
    :body="item.body"
    cta-text="想把这块能力用到你的项目里？"
  />
  <NotFound v-else back-to="/skills" back-label="返回技能" />
</template>

<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DetailShell from '../components/DetailShell.vue'
import NotFound from '../components/NotFound.vue'
import { getSkill } from '../content'

const route = useRoute()
const item = computed(() => getSkill(route.params.slug))
</script>
