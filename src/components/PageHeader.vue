<template>
  <section class="container page-head">
    <p class="label">{{ label }}</p>
    <h1 class="title">{{ title }}</h1>
    <p class="intro">{{ intro }}</p>
  </section>
</template>

<script setup>
defineProps({
  label: String,
  title: String,
  intro: String,
})
</script>
