# 代码风格

目标：**一个下午能读完的代码库**。宁可重复三行模板，不引入抽象。

## Vue 组件

- 一律 `<script setup>` + `<template>` + `<style scoped>`，顺序固定：template → script → style。
- import 顺序：vue 内置 → vue-router → 本地组件 → 本地模块/内容层。
- 一个视图只做一件事：列表页只渲染列表 + 空状态，详情页只负责取 slug 并交给 `DetailShell`。
- 组件超过 ~150 行先想是不是该拆；但**不要为两个用法的按钮抽组件**，直接复制更清晰。
- props 用具名 + 类型注释即可，不上 TS（项目刻意保持零类型负担）。

```vue
<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import DetailShell from '../components/DetailShell.vue'
import { getArticle } from '../content'

const route = useRoute()
const item = computed(() => getArticle(route.params.slug))
</script>
```

## 样式

- 组件样式必须 `scoped`；全局只放：令牌、`body` 底纹、`.container` / `.card` / `.btn` / `.label` / `.page-head` 这些跨页复用类。
- **不写内联 style**，动态值用 CSS 变量传递（如 `v-reveal` 写入 `--reveal-delay`）。
- 颜色/字体/圆角全部走 `var(--token)`，不出现裸值。
- 选择器最多两层嵌套的语义类（`.entry .title`），不用 BEM、不用 `!important`。
- 媒体查询写在文件末尾，断点只用 `700px`（页面头部）和 `640px`（列表/时间线）两档。

## 文案与数据

- **任何展示给用户的文字都不能硬编码在组件里**，必须来自 `content/`。这是硬规则：曾经因为文案散落在 vue 文件里，用户要改一句话得改代码。
- 组件只允许出现：结构性文字（`→`、`·` 这类符号）和逻辑占位。
- 数字（作品数、文章数、年限）**由代码算**，禁止手写。

## JS 约定

- 2 空格缩进、无分号、单引号（与现有文件保持一致）。
- 函数名动词开头：`readList` / `readItem` / `yearsSince` / `parseFrontmatter`。
- 纯函数放模块顶部，导出放底部。
- 不用 `any`、不用 `eval`、不引入 lodash/moment 这类重依赖；日期解析自己写正则（见 `yearsSince` / `sortKey`）。
- 注释写**为什么**，不写"做了什么"。例：

```js
// 由「起始时间」自动算出到今天的年限（保留一位小数）
// 兼容 2023.09 / 2023-09 / 2023/09/01 / 2023，new Date() 解析不了点号格式
```

## 组合式与指令

- 跨组件复用的浏览器能力抽 `composables/`（目前只有 `useCopy`）。
- 需要操作 DOM 的横切能力用自定义指令（`v-reveal`），不要在每个组件里 `onMounted + IntersectionObserver`。
- `useCopy` 必须保留 `navigator.clipboard` → `document.execCommand('copy')` 的降级，以及 1.6s 后重置提示的状态机。

## 提交与仓库

- 提交信息用 `feat:` / `fix:` / `chore:` 前缀 + 中文简述。
- `.gitignore` 必须包含：`node_modules`、`dist`、`.DS_Store`、`*.local`、`.vite`，以及本地工具的工作目录（编辑器缓存、agent 记忆目录一类，按实际用到的加）。
- 一个仓库只装一个站：不要在别人的大仓库子目录里直接提交（会卷进无关项目），先确认 `git rev-parse --show-toplevel` 指向本项目。

## 提交前自检

```bash
npm run build        # 必须零报错
grep -rn "#[0-9a-fA-F]\{3,6\}" src --include=*.vue   # 应该只剩 global.css 里的令牌
grep -rn "content/" src/views src/components          # 不应该出现在用户可见文案里
```
