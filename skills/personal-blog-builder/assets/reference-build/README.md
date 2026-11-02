# 参考实现

**这是一份"做法示例"，不是项目起点。**

它演示了一种具体的组合：卡片墙首页 + 作品/技能/文章三栏 + 暖白纸感视觉。这个组合只对某一类人合适。用户的栏目和风格是访谈定的，跟这里不一样是正常的。

## 怎么用它

**不要 `cp -R` 整个目录开工。** 复制过来之后你要删掉不属于用户的栏目、拆掉不适用的布局、重做整套颜色——比按需搭更慢，还容易把这里的栏目录和审美一起带进去。

正确的用法是**按需看单个文件**：

| 想看 | 看哪个文件 |
| --- | --- |
| 内容层怎么写（glob + frontmatter + 派生计算） | `src/content.js` |
| 数据怎么在构建期被内联 | `vite.config.js` |
| 一套完整的主题令牌长什么样 | `src/styles/themes/warm-paper.css` |
| 结构层通用类（容器/卡片/按钮/标签/动效） | `src/styles/global.css` |
| 列表页 + 详情页怎么分工 | `src/views/WorksView.vue` / `WorkDetail.vue` |
| 详情页外壳怎么复用 | `src/components/DetailShell.vue` |
| 空状态三行结构 | `src/components/EmptyState.vue` |
| 点击复制的降级处理 | `src/composables/useCopy.js` |
| 滚动揭示 + 无障碍兜底 | `src/directives/reveal.js` |
| 构建时注入 SEO / OG | `vite.config.js` 的 `injectMeta` |
| 404 兜底 | `src/components/NotFound.vue` |

看完自己写。目标不是让用户得到一个和这里一样的站，是让他得到一个**他自己的**站。

## 单独跑起来看效果

想直观感受这份实现能跑成什么样，可以临时跑一份（放在临时目录，别当项目起点）：

```bash
cp -R <skill>/assets/reference-build /tmp/ref-preview
cd /tmp/ref-preview
npm install
npm run dev
```

看完删掉 `/tmp/ref-preview`。

## 里面是什么

- 三栏内容（作品/技能/文章）+ 关于页 + 首页入口卡
- hash 路由 + 全局 404（静态托管下不改 history 模式）
- 内容全部在 `content/` 的 Markdown 里，构建期内联，无运行时请求
- 视觉收在一层主题令牌里，组件不写裸色值
- 三张示例插画（`src/assets/`），交付给人用时必须提示替换

## 已知不属于通用做法的地方

这些是这份实现的**具体选择**，不是规范。用户情况不同就该换：

- **三栏固定**：栏目应该由访谈决定，多一栏少一栏都要改路由和内容层。
- **卡片墙首页**：适合作品前置型。纯写作的站用单栏流更合适（见 `references/design-fragments.md` 的布局骨架）。
- **统计卡三张**：口径绑在"作品数 / 文章数 / 写代码年限"上。栏目变了口径要跟着改，别硬套。
- **暖白纸感**：只是一种风格。风格应该问过用户，或者按他的参照物定。

---

具体规范、片段、栏目约定都在 skill 的 `references/` 里，比读这份代码快。
