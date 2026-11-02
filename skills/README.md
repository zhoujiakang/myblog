# skills/

这个仓库**不再自带技能实体**。`personal-blog-builder` 已经独立成一个专门的技能仓库，在那里维护、版本化、接受贡献：

> **https://github.com/zhoujiakang/myskills/tree/main/personal-blog-builder**

这份技能把"从零搭一个个人站"写成可执行的流程——先访谈问清用户要什么，再按栏目搭骨架，风格做成可替换的主题层，文案全部外置到 Markdown。本站（`blog.zzzink.cn`）就是它的产物。

## 怎么用

**装成你自己的技能**（之后在任何项目里都能触发）：把 `personal-blog-builder/` 目录从上面那个仓库复制到你所用 agent 的技能目录。

```bash
git clone https://github.com/zhoujiakang/myskills.git
cp -R myskills/personal-blog-builder <你的 agent 技能目录>/
```

然后对 agent 说"给我做个个人站"、"加一篇文章"、"换个风格"，它就会加载。

**如果你的工具没有"技能"这个概念**：把那个仓库里的 `SKILL.md` 整个喂给 agent，或者说一句"读一下 `personal-blog-builder/SKILL.md`，按它帮我建站"即可——它入口处的场景判断表和按需加载的文件名都是照这条路写的，不依赖任何特定工具的机制。

**只想看看**：直接打开上面的链接读 `SKILL.md`，它是入口，其余文件按需展开。

## 一点说明

技能里的视觉规范是**可参考的默认值，不是规定**。栏目、风格、内容量都该由使用者自己定——这也正是 `references/interview.md` 那整套问话存在的理由。
