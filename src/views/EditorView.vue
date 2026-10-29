<script setup lang="ts">
import { ref, reactive, watch, onMounted, onUnmounted, computed } from 'vue';
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router';
import { site } from '../composables/useBlog';
import { refreshMermaid } from '../composables/useMermaid';
import type { Post, PostInput } from '../types/blog';
const route = useRoute(),
  router = useRouter();
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};
const blank = (): PostInput => ({
  slug: '',
  title: '',
  summary: '',
  date: today(),
  group: site.groups[0]?.name || '',
  tags: [],
  body: '',
  draft: true,
});
const form = reactive<PostInput>(blank());
const entries = ref<Post[]>([]),
  selected = ref(''),
  tagText = ref(''),
  preview = ref(''),
  message = ref(''),
  error = ref(false),
  busy = ref(false),
  dirty = ref(false),
  fileInput = ref<HTMLInputElement>();
const autosaveKey = 'mb:editor-recovery:v1';
let hydrating = false,
  previewTimer: ReturnType<typeof setTimeout>,
  requestId = 0;
async function api(endpoint: string, data?: unknown) {
  const result = await fetch(
    `/__local/${endpoint}`,
    data === undefined
      ? { cache: 'no-store' }
      : {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Blog-Editor': '1' },
          body: JSON.stringify(data),
        },
  );
  const json = await result.json();
  if (!result.ok) throw new Error(json.error || '请求失败');
  return json;
}
function notify(text: string, failed = false) {
  message.value = text;
  error.value = failed;
}
function replace(data: Omit<PostInput, 'draft'> & { draft?: boolean }) {
  hydrating = true;
  Object.assign(form, {
    slug: data.slug,
    title: data.title,
    summary: data.summary,
    date: data.date,
    group: data.group,
    tags: [...data.tags],
    body: data.body,
    draft: data.draft ?? false,
    revision: data.revision,
  });
  tagText.value = '';
  selected.value = data.revision ? data.slug : '';
  hydrating = false;
  dirty.value = false;
}
function recoverable() {
  return { ...form, tags: collectedTags() };
}
function collectedTags() {
  return [
    ...new Set([
      ...form.tags,
      ...tagText.value
        .split(/[,，\n]/)
        .map((t) => t.trim())
        .filter(Boolean),
    ]),
  ];
}
function addTag() {
  form.tags = collectedTags();
  tagText.value = '';
}
const chars = computed(() => form.body.replace(/\s/g, '').length);
const existingGroups = computed(() => [
  ...new Set([...site.groups.map((g) => g.name), ...entries.value.map((p) => p.group)]),
]);
async function refreshPreview() {
  const id = ++requestId;
  try {
    const rendered = await api('preview', { body: form.body });
    if (id === requestId) {
      preview.value = rendered.html;
      void refreshMermaid();
    }
  } catch (e) {
    if (id === requestId) notify((e as Error).message, true);
  }
}
watch(
  () => form.body,
  () => {
    clearTimeout(previewTimer);
    previewTimer = setTimeout(refreshPreview, 250);
  },
);
watch(
  [() => ({ ...form, tags: [...form.tags] }), tagText],
  () => {
    if (hydrating) return;
    dirty.value = true;
    try {
      localStorage.setItem(autosaveKey, JSON.stringify(recoverable()));
    } catch {
      notify('浏览器恢复缓存不可用，请及时保存到文章文件。', true);
    }
  },
  { deep: true, flush: 'sync' },
);
async function reloadEntries() {
  entries.value = await api('posts');
}
function loadSelected() {
  const post = entries.value.find((p) => p.slug === selected.value);
  if (!post) return;
  if (dirty.value && !confirm('放弃尚未保存到文件的更改，加载这篇文章？')) {
    selected.value = form.revision ? form.slug : '';
    return;
  }
  replace(post);
  notify(`已加载 ${post.draft ? '草稿' : '文章'}：${post.title}`);
  router.replace({ query: { slug: post.slug } });
}
function newPost() {
  if (dirty.value && !confirm('放弃当前更改，新建文章？')) return;
  replace(blank());
  localStorage.removeItem(autosaveKey);
  router.replace({ query: {} });
  notify('已新建文章');
}
async function save(draft: boolean) {
  if (busy.value) return;
  busy.value = true;
  try {
    addTag();
    const saved = await api('posts', { ...form, draft });
    replace(saved);
    localStorage.removeItem(autosaveKey);
    await reloadEntries();
    await router.replace({ query: { slug: saved.slug } });
    notify(
      `已保存${draft ? '草稿' : '文章'}到 content/posts/${saved.slug}.md。${draft ? '草稿不会进入公开构建。' : '提交并推送 Git 仓库后，线上博客才会更新。'}`,
    );
  } catch (e) {
    notify((e as Error).message, true);
  } finally {
    busy.value = false;
  }
}
async function importFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  try {
    if (file.size > 2 * 1024 * 1024) throw new Error('Markdown 文件不能超过 2 MB');
    if (dirty.value && !confirm('用导入内容替换当前未保存的内容？')) return;
    const raw = await file.text(),
      name = file.name.replace(/\.md$/i, '');
    const slug = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(name) ? name : `post-${Date.now()}`;
    const data = /^---\r?\n/.test(raw)
      ? await api('import', { raw, slug })
      : { ...blank(), slug, title: raw.match(/^#\s+(.+)$/m)?.[1] || name, body: raw };
    replace({ ...data, revision: undefined });
    dirty.value = true;
    localStorage.setItem(autosaveKey, JSON.stringify(recoverable()));
    notify('已导入，请检查标题、分组和日期后保存。导入不会覆盖已有文章。');
  } catch (e) {
    notify((e as Error).message, true);
  } finally {
    if (fileInput.value) fileInput.value.value = '';
  }
}
function download() {
  const { slug, body, revision, ...metadata } = recoverable();
  const text = `---\n${Object.entries(metadata)
    .map(([k, v]) => `${k}: ${JSON.stringify(v)}`)
    .join('\n')}\n---\n\n${body}\n`;
  const url = URL.createObjectURL(new Blob([text], { type: 'text/markdown;charset=utf-8' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = `${slug || 'article'}.md`;
  a.click();
  URL.revokeObjectURL(url);
}
function beforeUnload(event: BeforeUnloadEvent) {
  if (dirty.value) {
    event.preventDefault();
    event.returnValue = '';
  }
}
onBeforeRouteLeave(
  () => !dirty.value || confirm('文章尚未保存到文件，确认离开？浏览器会保留恢复缓存。'),
);
onMounted(async () => {
  window.addEventListener('beforeunload', beforeUnload);
  try {
    await reloadEntries();
    const cached = localStorage.getItem(autosaveKey);
    if (cached && confirm('发现尚未保存到文件的写作缓存，是否恢复？')) {
      replace(JSON.parse(cached));
      dirty.value = true;
      notify('已恢复浏览器缓存，请保存到文章文件。');
    } else {
      const target = entries.value.find((p) => p.slug === route.query.slug);
      if (target) replace(target);
    }
    await refreshPreview();
  } catch (e) {
    notify((e as Error).message, true);
  }
});
onUnmounted(() => {
  window.removeEventListener('beforeunload', beforeUnload);
  clearTimeout(previewTimer);
});
</script>
<template>
  <main class="wrap">
    <div class="page-head" style="padding-bottom: 0">
      <h1>{{ form.revision ? '编辑文章' : '写一篇' }}</h1>
      <p>本地写作，不会自动发布。文章保存在本项目的 Markdown 文件中。</p>
    </div>
    <div class="local-banner">
      <span class="badge">LOCAL ONLY</span
      ><span>保存到本地后，<b>提交并推送 Git 仓库即可更新博客</b>。草稿不会进入公开构建。</span>
    </div>
    <div class="editor-actions">
      <input
        ref="fileInput"
        class="sr-only"
        type="file"
        accept=".md,.markdown,text/markdown,text/plain"
        aria-label="选择 Markdown 文件"
        @change="importFile"
      /><button class="btn" :disabled="busy" @click="fileInput?.click()">导入 Markdown</button
      ><button class="btn" :disabled="busy" @click="save(true)">保存草稿</button
      ><button class="btn btn-primary" :disabled="busy" @click="save(false)">
        {{ busy ? '正在保存…' : '保存文章' }}</button
      ><button class="btn" @click="download">导出 Markdown</button
      ><span class="editor-stat"
        >{{ chars }} 字 · 约 {{ Math.max(1, Math.ceil(chars / 350)) }} 分钟</span
      >
    </div>
    <p v-if="message" class="editor-status" :class="{ 'has-error': error }" role="status">
      {{ message }}
    </p>
    <div class="editor-load">
      <label for="existing-post">已有文章 / 草稿</label
      ><select id="existing-post" v-model="selected" class="select" @change="loadSelected">
        <option value="" disabled>选择文章进行编辑</option>
        <option v-for="p in entries" :key="p.slug" :value="p.slug">
          {{ p.draft ? '[草稿] ' : '' }}{{ p.title }}
        </option></select
      ><button class="btn" @click="newPost">新建文章</button>
    </div>
    <div class="editor-grid">
      <div>
        <div class="field">
          <label for="f-title">标题</label
          ><input
            id="f-title"
            v-model="form.title"
            class="input"
            placeholder="文章标题"
            maxlength="200"
          />
        </div>
        <div class="field">
          <label for="f-slug">文章标识（保存后固定，用作链接和文件名）</label
          ><input
            id="f-slug"
            v-model="form.slug"
            class="input"
            :disabled="!!form.revision"
            placeholder="例如 mysql-index-notes"
            maxlength="100"
          />
        </div>
        <div class="field">
          <label for="f-summary">摘要</label
          ><input
            id="f-summary"
            v-model="form.summary"
            class="input"
            placeholder="用一两句话概括文章"
          />
        </div>
        <div class="field field-row">
          <div>
            <label for="f-date">发布日期</label
            ><input id="f-date" v-model="form.date" class="input" type="date" />
          </div>
          <div>
            <label for="f-group">分组（可直接输入新分组）</label
            ><input id="f-group" v-model="form.group" class="input" list="groups" /><datalist
              id="groups"
            >
              <option v-for="g in existingGroups" :key="g" :value="g" />
            </datalist>
          </div>
        </div>
        <div class="field">
          <label for="f-tags">标签（回车添加，点击标签移除）</label>
          <div class="tag-input">
            <button
              v-for="t in form.tags"
              :key="t"
              class="tag-sm"
              type="button"
              :aria-label="`移除标签 ${t}`"
              @click="form.tags = form.tags.filter((v) => v !== t)"
            >
              {{ t }} ×</button
            ><input
              id="f-tags"
              v-model="tagText"
              placeholder="添加标签…"
              @keydown.enter.prevent="addTag"
              @blur="addTag"
            />
          </div>
        </div>
        <div class="field">
          <label for="f-md">正文 · Markdown</label
          ><textarea
            id="f-md"
            v-model="form.body"
            class="textarea"
            spellcheck="false"
            placeholder="## 从这里开始写作…"
          ></textarea>
        </div>
        <p class="muted">
          {{ dirty ? '尚有更改未保存到文件，浏览器已尝试缓存。' : '内容已加载或已保存到文件。' }}
        </p>
      </div>
      <div class="preview-pane">
        <div class="bar"><span>预览</span><span>与公开博客使用相同渲染器</span></div>
        <div class="preview-body"><div class="prose" v-html="preview"></div></div>
      </div>
    </div>
  </main>
</template>
