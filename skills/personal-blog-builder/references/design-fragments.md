# 设计片段库

这里放的是**可参考、可摘取**的设计细节：令牌怎么分组、圆角取几档、阴影怎么配、配色盘怎么推、组件长什么样。

**用法**：按需挑片段，改到用户的项目里。不要整份照搬——用户选的栏目和风格才是主语，这些片段只是"这一块通常怎么做比较稳"的参考答案。

每条片段后面都写了两件事：**取值**和**为什么是这个取值**。知道后者才能在用户说"这里怪怪的"时改对地方。

---

## 一、令牌骨架

不管视觉走什么路线，都是同一组职责。先按职责列全，再填值——**先结构后数值，反了会反复返工**。

| 分组 | 令牌 | 职责 | 填值顺序 |
| --- | --- | --- | --- |
| 底色 | `--bg` `--bg-card` `--bg-hover` | 页面底、卡片面、悬停面 | 1 |
| 文字 | `--ink` `--ink-2` `--ink-3` `--muted` `--faint` | 从最深到最浅五级 | 2 |
| 强调 | `--accent` `--accent-soft` `--accent-wash` `--accent-halo` | 主色 / 浅底 / 洗色 / 光晕 | 3 |
| 按钮 | `--btn-bg` `--btn-fg` `--on-accent` | 按钮底 / 按钮字 / 填充块上的字 | 3 |
| 线与描边 | `--line` `--border-soft` `--border-strong` `--border-hover` | 分隔线 / 淡描边 / 强描边 / 悬停描边 | 4 |
| 形状 | `--radius-card` `--radius-btn` `--radius-chip` | 三档圆角 | 5 |
| 阴影 | `--shadow-card` `--shadow-lift` `--shadow-pop` | 静置 / 悬停浮起 / 弹层 | 5 |
| 底纹 | `--texture-image` `--texture-size` `--texture-position` | 纸纹、点阵，可设 `none` | 5 |
| 字体 | `--font-cjk` `--font-display` `--font-title` `--font-body` `--font-mono` | 中文兜底 + 四个角色 | 1 |

**一个都不能少。** 少一个就会有元素回退到浏览器默认（黑字或透明底），一眼能看出来。不需要底纹就写 `--texture-image: none`，别整行删。

---

## 二、配色盘：从底色推起来

不给固定色值，给推导顺序。这套顺序的价值在于：任何色相都能走通。

### 1. 定底色

三选一，**避免纯白**（`#fff` 会让卡片无处安放，卡片和页面分不开）：

| 路线 | 底色 | 特征 |
| --- | --- | --- |
| 暖白 | `#fbf7f0` 一类，色相 35–45，饱和度极低 | 纸感，配插画和手绘最舒服 |
| 冷白 | `#f7f8fa` 一类，色相 210–220，饱和度 5% 以内 | 干净，产品感 |
| 深色 | `#14130f`（暖黑）/ `#0f1115`（冷黑） | 强对比，编辑部气质 |

### 2. 定卡片面

- 浅色底：卡片用**比底更亮**（纯白或 `#fffdf8`）。卡片要像"浮在纸上的一张纸"。
- 深色底：卡片比底**亮 4–8%**（如底 `#0f1115` → 卡 `#171a20`）。深色里明度差要更小才不刺眼。

### 3. 定文字五级

同一色相逐级降对比，不要混色相（暖底配冷灰字会显脏）：

```
--ink      最深，正文与标题         对比度 ≥ 12:1
--ink-2    次级正文                  ≥ 9:1
--ink-3    弱化正文、说明            ≥ 7:1
--muted    辅助说明、页头 intro       ≥ 4.5:1
--faint    等宽小标签、日期           ≥ 3:1（只用在 12–15px）
```

**用明度降级，不要用透明度降级。** `opacity: 0.6` 的文字在深色底上会灰得发糊。

### 4. 定强调色

一个主强调，配三个衍生：

- `--accent`：饱和、可小面积用（链接、激活态）
- `--accent-soft`：主色的极浅版本，做底色块
- `--accent-wash`：主色 + 8–15% 透明度，做悬停背景
- `--accent-halo`：主色 + 10–15% 透明度，做径向光晕

**强调色只做点缀。** 一旦大面积铺，整站会变成"模板站"。判断标准：如果截图缩到 200px 宽还能明显看到一片强调色，就是铺多了。

### 5. 定线

三档，**用 `--ink` 的透明度，不要另配灰色**（另配灰色在换主题时会和文字脱节）：

```css
--border-soft:   rgba(34, 34, 32, 0.06);  /* 卡片描边、分隔线 */
--border-strong: rgba(34, 34, 32, 0.14);  /* 时间线竖线、需要看见的线 */
--border-hover:  rgba(34, 34, 32, 0.32);  /* 悬停时的描边 */
```

深色主题把基色换成 `255, 255, 255`，透明度整体抬高一点（`0.10 / 0.18 / 0.36`），否则线在暗底上直接消失。

---

## 三、圆角：三档就够

```css
--radius-card: 16px;   /* 大容器：卡片、面板、图片框 */
--radius-btn:  8px;    /* 中控件：按钮、输入框、代码块 */
--radius-chip: 999px;  /* 胶囊：标签、筛选 chip、头像 */
```

三条判断：

1. **面积越大圆角越大**。12px 圆角放在 400px 宽的卡片上几乎看不出来，放在 40px 高的按钮上又显得过圆。
2. **整站不超过三档**。多一档就有一处不一致，看起来像拼的。
3. **同一层级必须一样**。所有卡片同一个值——这一条比取多少更重要。

按风格调档：

| 风格 | card | btn | chip |
| --- | --- | --- | --- |
| 温和 / 纸感 | 16–20 | 8–10 | 999 |
| 干净 / 产品 | 10–12 | 6–8 | 999 或 8 |
| 硬朗 / 编辑部 | 0–4 | 0–4 | 0–4（方角） |
| 柔软 / 活泼 | 22–28 | 14–16 | 999 |

硬朗路线要同时**去掉阴影**，只留 1px 描边；方角配淡阴影会像没做完。

---

## 四、间距：两套节奏

页面级用大跨度，组件内用小步长。混着用会失去呼吸感。

```css
/* 组件内间距：8 的倍数，允许半档 */
4 / 8 / 12 / 16 / 18 / 24

/* 区块间距：用大跳 */
30 / 34 / 38 / 48 / 60
```

要点：

- **随手写 `37px` 会破坏节奏**。不确定就用最近的档。
- 卡片内边距：**大卡 24–28，小卡 16–20**。同一列表里卡片内边距必须一致。
- 子页头部 `padding-top: 100px`（移动端 `64px`），首屏不贴顶——这个差距影响第一印象很大。
- 段落之间靠 `margin-top` 单向下压，不要 `margin-bottom` 和 `margin-top` 同时上，会出现"双倍间距"。

---

## 五、阴影：浅底和深底两套配方

### 浅色底：双层，一层接触 + 一层体积

```css
--shadow-card: 0 1px 2px rgba(34, 34, 32, 0.03),
               0 10px 30px rgba(34, 34, 32, 0.04);
--shadow-lift: 0 1px 2px rgba(34, 34, 32, 0.04),
               0 16px 40px rgba(34, 34, 32, 0.08);
```

关键在**透明度都极低**（0.03–0.08）。第一层 1–2px 做"接触感"，第二层大模糊做"离地高度"。想要"浮起"而不是"投影"，就不要用 `0 4px 6px rgba(0,0,0,0.3)` 那种。

### 深色底：阴影基本无效，靠描边撑

```css
--shadow-card: inset 0 1px 0 rgba(255, 255, 255, 0.04);
--shadow-lift: 0 8px 24px rgba(0, 0, 0, 0.4);
```

**深色底必须保留描边**（`--border-soft` 抬到 0.10 左右）。否则卡片会和背景糊成一片，看起来"卡片消失了"。

---

## 六、字体：四个角色，一个中文兜底

| 角色 | 用途 | 建议 |
| --- | --- | --- |
| display | 页面大标题（800–900） | 几何无衬线（Inter / Satoshi）或衬线（Newsreader）看气质 |
| title | 卡片标题、年份（700） | 可以和大标题不同族，制造层次 |
| body | 正文、导语 | 可读性优先，别用 display 字体排正文 |
| mono | 标签、日期、单位、按钮 | 全站技术感的锚点 |

```css
--font-cjk: 'PingFang SC', 'Microsoft YaHei', 'Noto Sans SC', sans-serif;
--font-display: 'Inter', var(--font-cjk);
--font-title: 'Barlow', var(--font-cjk);
--font-body: 'Inter', var(--font-cjk);
--font-mono: 'Roboto Mono', ui-monospace, SFMono-Regular, monospace;
```

两条经验：

- **中文必须显式兜底**。只写 `'Inter'` 会让中文回退到浏览器默认宋体，和拉丁部分割裂。
- **等宽字体只做点缀**。一旦用来排正文，整站会变成"终端截图"。
- 只引需要的字重（400 / 700 / 900），引整套会让首屏拖几百 KB。

---

## 七、组件片段

### 卡片

```css
.card {
  background: var(--bg-card);
  border-radius: var(--radius-card);
  border: 1px solid var(--border-soft);
  box-shadow: var(--shadow-card);
  transition: transform 0.18s ease, box-shadow 0.18s ease,
              border-color 0.18s ease;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lift);
  border-color: var(--border-hover);
}
```

**四件套缺一不可**：底 + 圆角 + 淡描边 + 轻阴影。想更克制就去掉阴影留描边，别两样都去。

位移不要超过 3px——超过就像在"跳"，不是"浮"。

### 按钮

```css
.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  padding: 0 24px;
  border-radius: var(--radius-btn);
  background: var(--btn-bg);
  color: var(--btn-fg);
  font-family: var(--font-mono);
  font-size: 15px;
  transition: transform 0.15s ease, opacity 0.15s ease;
}

.btn:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
```

高度 44–52 是手感和紧凑的分界。填充按钮的底色如果很亮（如金色），字色要用该色的深色版本，**不要用纯白**（对比不足）。

### 胶囊 chip（筛选 / 标签）

```css
.chip {
  padding: 7px 15px;
  border-radius: var(--radius-chip);
  border: 1px solid var(--border-strong);
  font-family: var(--font-mono);
  font-size: 13px;
  color: var(--muted);
  transition: all 0.15s ease;
}

.chip.is-active {
  background: var(--accent);
  color: var(--on-accent);
  border-color: var(--accent);
}
```

激活态要检查两件事：文字在强调色上够不够清楚；未激活和激活的**重量差**够不够看出来。

### 时间线

```css
.timeline {
  position: relative;
  padding-left: 28px;
  border-left: 2px solid var(--border-strong);
}

.timeline-item::before {
  content: '';
  position: absolute;
  left: -7px;              /* 竖线宽 2 + 圆点 9 的一半 */
  width: 9px;
  height: 9px;
  border-radius: 50%;
  background: var(--bg);   /* 挖空：用页面底色，不是白色 */
  border: 2px solid var(--accent);
}
```

圆点中心必须是**页面底色挖空**（`var(--bg)`），不能用 `#fff`——换深色主题时会变成一撮白点。

### 代码块

如果站里有技术文章，这一段几乎必配。需要给主题补两个令牌：

```css
/* 加到主题文件里 */
--code-bg: rgba(34, 34, 32, 0.045);   /* 深色主题用 rgba(255,255,255,0.05) */
--code-fg: var(--ink-2);
```

```css
pre {
  margin: 24px 0;
  padding: 18px 20px;
  background: var(--code-bg);
  border: 1px solid var(--border-soft);
  border-radius: var(--radius-btn);
  overflow-x: auto;                    /* 长行横向滚动，不撑破布局 */
  font-family: var(--font-mono);
  font-size: 14px;
  line-height: 1.7;
  color: var(--code-fg);
}

/* 行内代码 */
p code,
li code {
  padding: 2px 6px;
  background: var(--code-bg);
  border-radius: 4px;
  font-family: var(--font-mono);
  font-size: 0.9em;
}
```

三个容易漏的点：`overflow-x: auto` 必须有（否则长命令行会把整个页面撑出横向滚动）；行内代码字号要比正文`0.9em`左右，不能同号（同号会显得笨重）；代码块不要加阴影。

### 空状态

```vue
<div class="empty">
  <p class="label">// works</p>
  <p class="empty-title">更多作品，敬请期待</p>
  <p class="empty-text">我正在打磨一些新项目，稍后再来逛逛。</p>
</div>
```

```css
.empty {
  padding: 80px 24px;
  text-align: center;
}

.empty-title {
  margin-top: 10px;
  font-family: var(--font-title);
  font-size: 20px;
  font-weight: 700;
  color: var(--ink-3);
}

.empty-text {
  margin-top: 8px;
  font-size: 14px;
  color: var(--muted);
}
```

**空状态是给访客看的，不是给自己的待办条。** 三行结构：等宽小标 → 一句标题 → 一句安抚。任何"去 content/xx 加 md"这类维护提示都不能出现。

### 布局骨架：两种起步形态

**卡片墙型**（作品前置，适合设计/前端）

```
┌ nav ─────────────────────────────┐
│  大字标题（两行）      [插画]      │  ← 首屏：左右分栏
│  身份行 / 一句招呼     [按钮]      │
├──────────────────────────────────┤
│  [入口卡] [入口卡] [入口卡] [入口卡] │  ← 2×2 或 4 列
├──────────────────────────────────┤
│  最近文章（3 条）                  │
└ footer ──────────────────────────┘
```

**单栏流型**（纯写作，适合技术博客）

```
┌ nav ─────────────────────────────┐
│  名字 + 一句话                     │  ← 首屏只有文字，没有图
├──────────────────────────────────┤
│  2026                              │
│  · 文章标题            03.14       │  ← 直接是归档列表
│  · 文章标题            02.21       │
└ footer ──────────────────────────┘
```

选哪种由访谈的"主次"决定，不要默认卡片墙——那是个人作品集的做法，写作者的站用卡片墙会显得内容很空。

---

## 八、两个交互片段

### 滚动揭示

```js
// directives/reveal.js
const io = new IntersectionObserver(
  (entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('reveal-in')
        io.unobserve(e.target)
      }
    })
  },
  { threshold: 0.12, rootMargin: '0px 0px -8% 0px' }
)
```

```css
.reveal { opacity: 0; will-change: opacity, transform; }

.reveal.reveal-in {
  animation: reveal-up 0.7s cubic-bezier(0.22, 1, 0.36, 1) both;
  animation-delay: var(--reveal-delay, 0ms);
}

@keyframes reveal-up {
  from { opacity: 0; transform: translateY(22px); }
  to   { opacity: 1; transform: none; }
}

@media (prefers-reduced-motion: reduce) {
  .reveal, .reveal.reveal-in {
    opacity: 1; animation: none; transform: none;
  }
}
```

只用一种入场动效。加了第二种（缩放 + 位移 + 模糊）就会显得廉价。列表错峰 `i * 80ms`，超过 8 项就不再累加，否则最后一项要等一秒多。

**`prefers-reduced-motion` 兜底不是可选项**：初始态 `opacity: 0`，如果动画被系统关掉又不兜底，用户看到的是空白页。

### 点击复制

比 `mailto:` 实在——很多人没配邮件客户端。要点：

```js
export function useCopy(timeout = 1600) {
  const copied = ref(false)
  async function copy(text) {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      // 非 https / 老浏览器降级
      const ta = document.createElement('textarea')
      ta.value = text
      ta.style.position = 'fixed'
      ta.style.opacity = '0'
      document.body.appendChild(ta)
      ta.select()
      document.execCommand('copy')
      document.body.removeChild(ta)
    }
    copied.value = true
    setTimeout(() => (copied.value = false), timeout)
  }
  return { copied, copy }
}
```

**点击后文字不要改成"已复制"**：按钮宽度会变、布局会跳。只弹一个小气泡提示，按钮文案不动。

---

## 九、自检

改完视觉，逐条过：

- [ ] 组件里没有裸色值 / 裸圆角 / 裸阴影（全部走令牌）
- [ ] 圆角档位 ≤ 3 种，同层级一致
- [ ] 间距都在节奏表里，没有 `37px` 这种
- [ ] 深色底下卡片有描边，没有消失
- [ ] 强调色没有大面积铺开
- [ ] `--ink` 与 `--bg` 对比度 ≥ 7:1
- [ ] 640px 宽无横向溢出
- [ ] 长代码行 / 长 URL 不会撑破容器
- [ ] `prefers-reduced-motion` 下内容可见

```bash
grep -rnoE "rgba\([0-9]+, [0-9]+, [0-9]+, [0-9.]+\)|#[0-9a-fA-F]{3,6}" src \
  --include=*.vue --include=*.css | grep -v "styles/themes/"
# 只应剩下 mask-image 用的 #000
```
