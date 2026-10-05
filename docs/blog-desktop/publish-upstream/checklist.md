# 首次 Git 推送上游配置 Checklist

## 实现完整性

- [x] 没有 upstream 的本地分支生成 `git push --set-upstream origin <当前分支>`，不使用强制参数（验证：推送计划单元测试和临时 bare remote 集成测试；首次推送建立 `origin/main`）。
- [x] 已有 upstream 的本地分支生成普通 `git push`，不重复修改跟踪关系（验证：推送计划单元测试和第二次提交推送成功）。
- [x] 缺少 `origin` 或当前处于 detached HEAD 时在推送前停止，并显示可操作的错误建议（验证：推送计划单元测试；detached HEAD 的真实 Git 推送被拒绝）。
- [x] 推送失败时不删除、回滚或覆盖文章源文件和本地提交（验证：代码路径未包含 reset、force push 或回滚逻辑；失败进入现有错误状态）。
- [x] 发布确认仍然是推送流程的前置条件（验证：发布代码先显示确认框，确认后才进入构建/提交/推送）。

## 发布流程

- [x] 用户确认后仍按 Hexo 生成 -> 暂存 -> 提交 -> 推送顺序执行（验证：发布流程代码检查和临时仓库日志）。
- [x] 推送成功才显示发布成功；推送失败显示推送阶段错误（验证：推送返回非零时抛错进入现有错误状态，成功分支才设置“发布成功”）。
- [x] 首次推送完成后当前分支跟踪 `origin/<当前分支>`（验证：临时仓库返回 `origin/main`）。

## 回归验证

- [x] 现有文章 Front Matter 保留测试通过（验证：`flutter test`，10 个测试全部通过）。
- [x] 随心记和 Markdown 编辑器测试通过（验证：`flutter test`，10 个测试全部通过）。
- [x] Flutter 静态分析无 error（验证：`flutter analyze`，无 error，仅 14 条既有提示）。
- [x] macOS release 构建成功（验证：`flutter build macos`，生成 `blog_desktop.app`）。
- [x] 当前 `hexo-blog` 的本地提交和测试文章仍然存在，未执行重置或删除（验证：提交 `40b32f3` 和测试文章文件均存在）。

## 安全边界

- [x] 实现中不包含 `git push --force`、`git reset` 或自动回滚命令（验证：代码搜索无匹配）。
- [x] 验证过程只使用临时 bare remote，不向用户的 GitHub `origin` 执行新的推送（验证：集成测试使用 `/tmp/blog-desk-git-test.iK8pA9/remote.git`）。
