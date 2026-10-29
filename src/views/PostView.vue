<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import { posts, groupSlug } from '../composables/useBlog';
import { refreshMermaid } from '../composables/useMermaid';
import ArticleToc from '../components/ArticleToc.vue';
import NotFoundView from './NotFoundView.vue';
const route = useRoute();
const post = computed(() => posts.value.find((p) => p.slug === route.params.slug));
const back = computed(() => {
  const value = String(route.query.returnTo || '/articles');
  return /^\/(?:articles(?:\?|$)|categories$|tags$|$)/.test(value) ? value : '/articles';
});
const siblings = computed(() =>
  posts.value
    .filter((p) => p.group === post.value?.group)
    .slice()
    .reverse(),
);
const index = computed(() => siblings.value.findIndex((p) => p.slug === post.value?.slug));
const previous = computed(() => siblings.value[index.value - 1]),
  next = computed(() => siblings.value[index.value + 1]);
const active = ref(''),
  progress = ref(0),
  showTop = ref(false);
function scroll() {
  const headings = post.value?.toc || [];
  let id = headings[0]?.id || '';
  headings.forEach((h) => {
    const target = document.getElementById(h.id);
    if (target && target.getBoundingClientRect().top <= 130) id = h.id;
  });
  active.value = id;
  const height = document.documentElement.scrollHeight - innerHeight;
  progress.value = height > 0 ? (scrollY / height) * 100 : 0;
  showTop.value = scrollY > 600;
}
async function copy(event: MouseEvent) {
  const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a');
  if (anchor?.getAttribute('href')?.startsWith('#')) {
    event.preventDefault();
    document
      .getElementById(anchor.getAttribute('href')!.slice(1))
      ?.scrollIntoView({ behavior: 'smooth' });
    return;
  }
  const button = (event.target as HTMLElement).closest<HTMLButtonElement>('.copy');
  if (!button) return;
  const text = button.closest('.code-block')?.querySelector('code')?.textContent || '';
  try {
    await navigator.clipboard.writeText(text);
    button.textContent = '已复制';
  } catch {
    button.textContent = '复制失败，请手动选择';
  }
  setTimeout(() => {
    if (button.isConnected) button.textContent = '复制';
  }, 1600);
}
function toTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' });
}
watch(
  () => route.params.slug,
  async () => {
    await nextTick();
    scroll();
  },
);
watch(
  () => post.value?.html,
  () => void refreshMermaid(),
);
onMounted(() => {
  window.addEventListener('scroll', scroll, { passive: true });
  scroll();
  void refreshMermaid();
});
onUnmounted(() => window.removeEventListener('scroll', scroll));
</script>
<template>
  <template v-if="post"
    ><div class="progress" :style="{ width: `${progress}%` }"></div>
    <main class="wrap">
      <div class="reading">
        <article>
          <header class="article-head">
            <RouterLink class="backlink" :to="back"
              >← 返回{{ back === '/' ? '首页' : '文章列表' }}</RouterLink
            ><RouterLink
              class="eyebrow"
              :to="{ path: '/articles', query: { cat: groupSlug(post.group) } }"
              >{{ post.group }}</RouterLink
            >
            <h1>{{ post.title }}</h1>
            <div class="meta">
              <span>{{ post.date }}</span
              ><span class="dot"></span><span>{{ post.minutes }} min</span><span class="dot"></span
              ><span>约 {{ post.words.toLocaleString() }} 字</span>
            </div>
            <div class="post-tags">
              <RouterLink
                v-for="tag in post.tags"
                :key="tag"
                class="tag-sm"
                :to="{ path: '/articles', query: { tag } }"
                >{{ tag }}</RouterLink
              >
            </div>
            <p class="lead">{{ post.summary }}</p>
          </header>
          <details v-if="post.toc.length" class="toc-mobile">
            <summary>
              本页目录 <span>{{ post.toc.length }} 节</span>
            </summary>
            <ArticleToc :headings="post.toc" :active="active" />
          </details>
          <div class="prose" v-html="post.html" @click="copy"></div>
          <nav class="pager" aria-label="同组文章">
            <RouterLink
              v-if="previous"
              :to="{ path: `/posts/${previous.slug}`, query: { returnTo: back } }"
              ><span class="k">← 同分组上一篇</span
              ><span class="t">{{ previous.title }}</span></RouterLink
            ><span v-else></span
            ><RouterLink
              v-if="next"
              class="next"
              :to="{ path: `/posts/${next.slug}`, query: { returnTo: back } }"
              ><span class="k">同分组下一篇 →</span
              ><span class="t">{{ next.title }}</span></RouterLink
            >
          </nav>
        </article>
        <aside v-if="post.toc.length" class="toc toc-desktop">
          <h2>本页目录</h2>
          <ArticleToc :headings="post.toc" :active="active" />
        </aside>
      </div>
    </main>
    <button class="totop" :class="{ show: showTop }" aria-label="回到顶部" @click="toTop">
      ↑
    </button></template
  ><NotFoundView v-else />
</template>
