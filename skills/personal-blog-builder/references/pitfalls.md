<!--
  踩坑清单：每条都是这个项目真实发生过的问题。
  格式固定：症状 → 原因 → 处理。照抄"处理"列即可避免重犯。
-->

# 踩坑清单

## 先按症状定位

| 症状 | 先查什么 | 去哪里 |
| --- | --- | --- |
| 改了 md，页面没变 | frontmatter 字段名写错（不报错，只是不显示）；dev 是不是还在跑旧进程 | `D3` + `content-schema.md` |
| 页面白屏、子页面刷新 404 | `base` 是否 `'./'`；路由是否被改成 history 模式 | `D2` + `deploy-pages.md` §8 |
| 分享出去没图 / 图不对 | `siteUrl` 是否真实域名、图是否 1200×630、标签是否静态写在 head | `F1`–`F4` |
| 部署显示成功，线上还是旧站 | 分支是否 `main`、Actions 是否真触发、是不是 CDN 缓存 | `E2`/`E3` + `deploy-pages.md` §8 |
| 部署后自定义域掉了 | `public/CNAME` 是否还在 | `E1` |
| 换主题后卡片像消失、颜色发脏 | 组件里是否还有裸色值、裸阴影、裸圆角 | `B5`–`B7` |
| 深色主题里插画像一块贴错的纸 | 暖米底插画与深色底冲突 | `B8` |
| 手机上有横向滚动 | 固定宽度容器、长代码块、大图 | `B4` |

找不到对应症状时，按 A–G 分组往下翻。

## A. 内容层

### A1. 文案硬编码在组件里
- **症状**：用户想改一句标语，需要打开 `.vue` 找字符串、改代码、重新构建。
- **原因**：初期把 UI 文案直接写在模板里。
- **处理**：所有用户可见文字搬进 `content/`（`site.md` 放全站配置，各页放各自 md）。组件里只留符号（`→`、`·`）。改造时按页面逐个 grep 中文，清空为止。

### A2. 统计数字写死
- **症状**：关于页写着 `20+ 项目 / 12 文章 / 3 yr`，实际只有 2 个作品，访客一眼看穿。
- **原因**：`stats` 被当成静态文案写进 `about.md`。
- **处理**：`src/content.js` 里由 `works.length`、`articles.length`、`yearsSince(codingSince)` 生成，`about.md` 只保留 `codingSince`。**永远不要为了"好看"调大数字。**

### A3. 「写代码年限」算不出来
- **症状**：`new Date('2023.09')` 得到 `Invalid Date`，年限显示 `NaN` 或 0。
- **原因**：点号格式不被 `Date` 解析。
- **处理**：`yearsSince()` 用 `match(/\d+/g)` 取年月日自己拼 `new Date(y, m-1, d)`，并用 `365.25` 天年长换算、`Math.round(x*10)/10` 保留一位小数，`Math.max(0, ...)` 防负数。

### A4. 列表顺序不受控
- **症状**：新加的内容跑到最前面或随机位置。
- **原因**：`readList()` 按文件路径 `sort()`，没有数字前缀时按字典序。
- **处理**：文件名统一 `NN-slug.md`。**slug 会进 URL**，所以数字前缀只用于排序，改前缀不改链接、改 slug 会断链接。

### A5. 正文里的 Markdown 语法原样显示
- **症状**：写了 `**加粗**`，页面上真的出现星号。
- **原因**：正文按纯文本插值渲染，没有 Markdown 解析器。
- **处理**：正文写纯文本 + 空行分段。真要富文本，得引入 `markdown-it` 并在 `DetailShell` 里 `v-html`（同时要处理 XSS：只渲染自己写的 md 才安全）。

## B. 视觉

### B1. 统计卡"上重下空、数字单位粘连"
- **症状**：卡片上半挤着一堆说明、下半空荡；数字和单位贴成 `0repo`。
- **原因**：标签当说明放在数字下方，且数字/单位同一字号同一基线。
- **处理**：标签**置顶当 kicker**（等宽小字），数字沉到底部（`margin-top:auto`），单位小一号且与数字 baseline 对齐、留 7px 间隙：

```html
<div class="stat">
  <span class="kicker">开源项目</span>
  <div class="num">{{ s.num }}<span class="unit">{{ s.unit }}</span></div>
</div>
```

### B2. 空状态写成了维护提示
- **症状**：`还没有作品，去 content/works/ 添加 md 文件`——这是给站长看的，访客看到会困惑，还暴露了内部结构。
- **原因**：开发期图方便。
- **处理**：统一文案三段式（`// works` / `更多作品，敬请期待` / `我正在打磨一些新项目，稍后再来逛逛。`），抽成 `EmptyState.vue`。

### B3. 删掉底纹后页面变廉价
- **症状**：换成纯色底后，留白显得空旷、卡片浮不起来。
- **处理**：`body` 保留 22px 网格的极淡点阵（透明度 0.16），嫌重调透明度而不是删除。

### B4. 移动端横向溢出
- **症状**：640px 以下页面能左右拖动，时间线、meta 行被撑宽。
- **原因**：`grid-template-columns: 96px 1fr auto` 这类三列布局在窄屏放不下。
- **处理**：`@media (max-width: 640px)` 把 `entry` 改单列、隐藏圆点、tag 改左对齐；详情页 meta 行改 `flex-wrap: wrap`。

### B5. 换主题后深色底上"卡片消失"
- **症状**：切到深色主题，卡片和背景糊成一片，看不出层次。
- **原因**：只替换了颜色，`--shadow-*` 和 `--border-*` 还是浅色主题的值；深色下淡阴影几乎不可见。
- **处理**：深色主题必须靠描边撑层次——`--border-soft` 提到 `rgba(浅色文字, 0.10)` 以上，`--shadow-card` 可退化成一条 1px 内阴影。**不要**用更重的投影补，会发脏。

### B6. 只换色不换形状/底纹，风格没变
- **症状**：用户说"换个风格"，换完颜色还是同一股味道。
- **原因**：圆角、阴影质感、底纹才是气质来源；只改色只是"换了个色号"。
- **处理**：主题必须同时调整 `--radius-*`（16px 圆润 vs 6–10px 利落）、`--shadow-*`、`--texture-*`（点阵 / 网格 / 无）。这三项一起动，风格差异才成立。

### B7. 组件里的硬编码颜色漏网
- **症状**：换主题后个别元素还是旧配色（常见于 chip 描边、时间线竖线、CTA 底色、鼠标悬停背景）。
- **原因**：主题只改了令牌，但组件里有 `rgba(34, 34, 32, ...)` 这类直接写死的值。
- **处理**：换主题前先跑一遍扫描，把残留全部收敛到令牌：
```bash
grep -rnoE "rgba\([0-9]+, [0-9]+, [0-9]+, [0-9.]+\)|#[0-9a-fA-F]{3,6}" src \
  --include=*.vue --include=*.css | grep -v "styles/themes/"
```
只应剩下 `mask-image` 用的 `#000` 和 `rgba(0,0,0,0)`。

### B8. 深色/冷色主题配暖米底插画
- **症状**：深色页面上，首页插画像一块贴错的米色卡片，边缘还很硬。
- **原因**：示例插画是暖米底 + 人物，`mask-image` 只是羽化，不改变底色。
- **处理**：换主题时一并换插画（保持文件名 `hero.png`/`avatar.png`/`dog.png` 即可），或改用纯色/线稿，或干脆在深色主题里去掉首页大图。**别指望用 `filter` 硬调**，会脏。

## C. 交互

### C1. 复制按钮点完文字变成"已复制"
- **症状**：用户明确不要这个行为——按钮宽度跳动，视觉噪音。
- **处理**：按钮文案**永不变**，改由页面底部/按钮旁弹一个小气泡，1.6s 后自动消失（`useCopy` 的 `copied` 状态 + `copyTip` 文案，`{email}` 占位替换）。

### C2. `navigator.clipboard` 在非安全上下文失效
- **症状**：本地用 IP 访问（`http://192.168.x.x:5173`）时点击复制没反应，控制台报 `undefined`。
- **原因**：Clipboard API 只在 HTTPS / localhost 可用。
- **处理**：`useCopy` 里先试 `navigator.clipboard.writeText`，`catch` 后降级到隐藏 `textarea` + `document.execCommand('copy')`，两条路都失败才提示失败。

### C3. 文案链接方式不统一
- **症状**：邮箱有的地方是 `mailto:`、有的是复制，手机号是 `tel:`，行为不一致。
- **处理**：全站联系方式统一"点击复制"（GitHub 除外，它是真的跳转）。**不要**混用。

## D. 构建

### D1. 字体依赖 Google Fonts CDN
- **症状**：国内网络下首屏字体延迟、FOUC，甚至一直停在 fallback。
- **处理**：`@fontsource/inter`、`@fontsource/barlow`、`@fontsource/roboto-mono` 本地化，`main.js` 里只引需要的字重；中文用系统栈 `PingFang SC / Microsoft YaHei / Noto Sans SC`，**不要自托管中文字库**（几 MB 且没必要）。

### D2. `base` 配错导致 GitHub Pages 白屏
- **症状**：部署到 `username.github.io/repo/` 后 HTML 能打开但 JS/CSS 404，页面全白。
- **原因**：`base` 默认 `/`，资源指向域名根。
- **处理**：`base: './'` + hash 路由。自定义域名部署在根路径时同样安全。

### D3. 改完文案忘记重建
- **症状**：线上还是旧文案。
- **原因**：内容是 `import.meta.glob(..., { eager:true })` **构建期内联**，不重新 build 不会更新。
- **处理**：正常流程是 `git push` 触发 Actions 自动构建；本地验证用 `npm run dev`（有热更新）。

## E. 部署

### E1. 自定义域每次部署后丢失
- **症状**：绑定 `blog.example.com` 后，推一次代码域名就回到 `username.github.io/repo`。
- **处理**：`public/CNAME` 内容写一行域名（不带协议、不带尾斜杠）。构建时会被复制到 `dist/CNAME`。

### E2. 推了代码但 Actions 不触发
- **症状**：`git push` 成功，仓库没有任何 workflow 运行。
- **原因**：`deploy.yml` 写的是 `branches: [main]`，本地分支叫 `master`。
- **处理**：`git branch -m master main` 统一分支名；或改 yml。**先看 `git branch --show-current`。**

### E3. Pages 源不是 GitHub Actions
- **症状**：部署后线上是源码（`index.html` 里是 `src/main.js`），页面空白或 404。
- **原因**：Pages 的 `build_type` 是 `legacy`（从分支直接发布）。
- **处理**：`gh api -X POST repos/{owner}/{repo}/pages -f build_type=workflow`，或在 Settings → Pages → Source 选 **GitHub Actions**。

### E4. 覆盖已有仓库把历史冲掉
- **症状**：`--force` 强推后旧内容无法回滚。
- **处理**：强推前先备份：
```bash
git fetch origin
git push origin origin/main:refs/heads/backup-before-overwrite-$(date +%Y%m%d)
git push --force-with-lease origin main
```
恢复：`git push --force origin backup-before-overwrite-YYYYMMDD:main`

### E5. 在别人的大仓库子目录里初始化了项目
- **症状**：`git add .` 把十几个无关项目一起暂存。
- **处理**：先 `git rev-parse --show-toplevel` 确认根目录；不是本项目就在项目内 `git init` 独立仓库。提交前用守门检查：
```bash
git add -A && git status --short | grep -qE 'node_modules/|dist/' && { echo ABORT; git reset -q; }
```

## F. OG / 社交分享

### F1. 正方形图当 OG 封面被裁
- **症状**：微信/Telegram 预览卡里人物只剩半个头。
- **原因**：OG 标准约 1.91:1（1200×630），平台会按横条裁切或加黑边。
- **处理**：用 `scripts/make_og_image.py` 把原图重排成 1200×630（左右用原图边缘色无缝延伸），不要直接塞方图。

### F2. AI 重绘 OG 图出问题
- **症状**：角色脸/衣服/配色和首页对不上（角色漂移），且右下角带"AI生成"水印。
- **处理**：**优先用原图重排**（100% 一致、零水印）。必须重绘时，把水印区域一起裁掉或重新出图。

### F3. `og:image` 相对路径无效
- **症状**：分享卡片没有图。
- **原因**：爬虫要求绝对 URL。
- **处理**：`siteUrl` 必填且**写全二级域**（`https://blog.example.com`，不是 `https://example.com`）；拼接时先 `replace(/\/$/, '')` 去尾斜杠。

### F4. meta 标签用 JS 动态写
- **症状**：浏览器里看 DOM 有 og 标签，分享出去却没有。
- **原因**：爬虫不执行 JS。
- **处理**：在 `vite.config.js` 用 `transformIndexHtml` 构建时注入（`injectMeta` 插件从 `content/site.md` 读取），标签必须在静态 HTML 里。

### F5. 子页面分享卡片都一样
- **症状**：分享某篇文章，卡片显示的是站点首页标题和封面。
- **原因**：hash 路由 + SPA，所有 URL 返回同一份 `index.html`，爬虫只看到那一个 head。
- **处理**：这是已知限制，可接受（统一品牌卡）。真要每篇独立卡片，需引入预渲染（`vite-plugin-prerender` / `vite-ssg`）为每个路由产出独立 HTML，并改用 history 路由 + 静态托管 fallback。

## G. 沟通与流程

### G1. "我的域名是 xxx.com" 实际是二级域
- **症状**：`siteUrl` 写成顶级域，OG 图地址指向不存在的路径。
- **处理**：**上线前逐字确认**用户填的域名到底是 `example.com` 还是 `blog.example.com`，并回读一次注入后的 `og:image` 值给用户确认。
- **教训**：域名、仓库名、分支名这三件事，都要用"命令输出"证明，不能靠口头推断。

### G2. 误建仓库
- **症状**：用户只是问"要不要建仓库"，agent 直接执行了 `gh repo create`。
- **处理**：任何在用户账号下创建/删除远程资源的操作，先确认命名与公开性。已经误建就立即删除，并核对 `gh repo list`。
- **删除仓库需要 `delete_repo` scope**：`gh auth refresh -h github.com -s delete_repo`。

### G3. 用 heredoc 追加中文日志失败
- **症状**：`cat >> file <<EOF` 写入后内容错乱或命令报错。
- **处理**：改用 Python 追加（`open(..., 'a').write(...)`）或直接用编辑工具写文件，避免 shell 解析中文/引号。
