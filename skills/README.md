# skills/

这个仓库除了站点本身，还附带一个技能包：**`personal-blog-builder`**。

它把"从零搭一个个人站"这件事写成了可执行的流程——先访谈问清用户要什么，再按栏目搭骨架，风格做成可替换的主题层，文案全部外置到 Markdown。本站就是这套流程的产物。

## 里面有什么

```
personal-blog-builder/
├── SKILL.md                  入口：怎么判断场景、六步主流程、边界
├── references/
│   ├── interview.md          访谈路线：问什么、怎么问、用户没想法时怎么办
│   ├── content-schema.md     栏目怎么定、Markdown 字段怎么写
│   ├── styles.md             风格怎么问、怎么出候选、怎么落成主题文件
│   ├── design-fragments.md   可摘取的片段：令牌、配色推导、圆角、阴影、组件样式
│   ├── design-spec.md        默认规格：网格、字阶、动效、空状态
│   ├── architecture.md       工程结构、加删栏目的步骤、什么时候该换方案
│   ├── code-style.md         Vue / 样式 / 文案约定
│   ├── pitfalls.md           真实踩过的坑，按症状速查
│   ├── editing-a-site.md     建完之后改内容、改风格、改结构
│   └── deploy-pages.md       上线、绑域名、排错、回滚
├── scripts/make_og_image.py  把任意图重排成 1.91:1 的分享封面
└── assets/reference-build/   一份脱敏的参考实现，用来看"某个交互怎么写的"
```

## 怎么用

**装成你自己的技能**（之后在任何项目里都能触发）：把整个 `personal-blog-builder/` 目录复制到你所用 agent 的技能目录。

```bash
cp -R skills/personal-blog-builder <你的 agent 技能目录>/
```

然后对 agent 说"给我做个个人站"、"加一篇文章"、"换个风格"，它就会加载。

**如果你的工具没有"技能"这个概念**：把 `SKILL.md` 整个喂给 agent，或者说一句"读一下 skills/personal-blog-builder/SKILL.md，按它帮我建站"即可——它入口处的判断表和按需加载的文件名都是照着这条路写的，不依赖任何特定工具的机制。

**只想看看**：直接读 `SKILL.md`，它是入口，其余文件按需展开。

## 两点说明

`assets/reference-build/` 是**参考实现，不是起点**。它带着某一套站的栏目和视觉，直接 `cp -R` 开工要删改一半，比按需搭更慢，还会把不属于你的审美一起带进去。要查的时候只看需要的那一个文件。

技能里的视觉规范是**可参考的默认值**，不是规定。栏目、风格、内容量都该由使用者自己定——这也正是 `interview.md` 那一整套问话存在的理由。
