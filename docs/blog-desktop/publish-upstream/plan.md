# 首次 Git 推送上游配置 Plan

## 架构概览

沿用当前 Flutter 应用的发布编排，不新增页面和远程仓库配置模块：

1. 工作区发布动作继续负责用户确认、Hexo 构建和本地提交。
2. Git 命令服务新增一次推送前的仓库状态解析，决定使用普通推送还是首次设置 upstream 的推送。
3. 推送命令失败时沿用现有错误状态，将 Git 输出传回界面；成功后才显示“发布成功”。

## 核心数据结构

### `GitPushPlan`

- `remoteName`：默认值为 `origin`。
- `branchName`：当前检出的本地分支名称。
- `hasUpstream`：当前分支是否已经解析出远程跟踪分支。
- `arguments`：最终传给 Git 的推送参数。

该结构只描述推送决策，不保存凭据，也不改变 Git 工作区。

## 接口

### `GitPushPlan.fromRepositoryState`

- 输入：当前分支名称、默认远程是否存在、是否存在 upstream。
- 输出：`GitPushPlan`。
- 错误：当前处于 detached HEAD 或默认远程不存在时返回可操作的领域错误。
- 规则：有 upstream 时返回普通 `push` 参数；无 upstream 时返回 `push --set-upstream origin <branch>` 参数。

### `BlogService.push`

- 输入：博客项目根目录。
- 行为：依次读取当前分支、验证 `origin`、检查 upstream，再执行 `GitPushPlan` 中的推送参数。
- 输出：统一的命令结果，包含退出码和脱敏前的 Git 输出摘要。
- 失败：保留本地提交和文章文件，不执行重置、回滚或强制推送。

## 模块设计

### 发布编排

- 保持现有顺序：Hexo 生成 -> `git add .` -> `git commit` -> Git 推送。
- 将最后的裸 `git push` 替换为 Git 服务的推送方法。
- 提交返回“没有需要提交的内容”时保持现有兼容行为；推送阶段仍必须执行状态解析和推送。
- 推送错误直接进入现有失败提示，不设置成功消息。

### Git 状态解析

- 使用当前仓库工作目录执行 Git 命令，避免依赖应用启动目录。
- 用分支查询判断 detached HEAD。
- 用远程查询确认 `origin` 可用。
- 用 upstream 查询区分首次推送和后续推送；查询失败只在明确表示没有 upstream 时进入首次推送路径，其他仓库错误继续失败。
- 不读取或打印凭据内容。

### 错误信息

- detached HEAD：提示切换到本地分支后重试。
- 缺少 `origin`：提示先配置名为 `origin` 的远程仓库。
- 推送失败：保留 Git 返回信息，并提示检查凭据、网络、远程拒绝或冲突。

## 模块交互

```text
用户确认发布
  -> Hexo generate
  -> git add / git commit
  -> 查询当前分支
  -> 验证 origin
  -> 查询 upstream
  -> 选择 push 或 push --set-upstream origin <branch>
  -> 成功消息 / 可读失败消息
```

## 文件组织

| 操作 | 文件 | 变更职责 |
|---|---|---|
| 修改 | `/Users/zzz/code/myblog/blog-desktop/lib/main.dart` | 增加推送决策模型、仓库状态查询和发布流程接入 |
| 修改 | `/Users/zzz/code/myblog/blog-desktop/test/widget_test.dart` | 覆盖普通推送参数、首次 upstream 参数和非法仓库状态 |
| 新建 | `/Users/zzz/code/myblog/hexo-blog/docs/blog-desktop/publish-upstream/task.md` | 拆分实现与验证任务 |
| 新建 | `/Users/zzz/code/myblog/hexo-blog/docs/blog-desktop/publish-upstream/checklist.md` | 定义最终验收项 |

## 技术决策

| 决策点 | 选择 | 理由 |
|---|---|---|
| 默认远程 | 固定使用现有发布流程约定的 `origin` | 避免本次修复扩大为远程选择功能，并与当前仓库配置一致。 |
| 首次推送 | `git push --set-upstream origin <当前分支>` | 建立跟踪关系且不覆盖远程历史，后续可回到普通推送。 |
| upstream 检测 | 通过 Git 仓库状态查询 | 不解析 `.git/config`，兼容 Git 的实际配置和不同平台。 |
| detached HEAD | 在推送前失败 | 没有安全的当前分支名称时不猜测目标分支。 |
| 测试策略 | 纯推送参数单元测试 + 临时 Git 仓库手动集成验证 | 单元测试稳定覆盖决策，临时仓库验证真实 upstream 行为。 |

## 风险与处理

- 远程已存在同名分支但历史不兼容：交给 Git 拒绝推送，应用不强制覆盖。
- 推送在远端成功但本地进程读取响应失败：界面可能显示失败；保留 Git 输出并允许用户检查远程提交，不自动重试。
- 当前仓库已有本地提交但没有 upstream：推送整个当前分支到 `origin/<当前分支>`，不改变提交内容。
