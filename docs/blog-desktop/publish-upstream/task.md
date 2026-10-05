# 首次 Git 推送上游配置 Tasks

## 文件清单

| 操作 | 文件 | 职责 |
|---|---|---|
| 修改 | `/Users/zzz/code/myblog/blog-desktop/lib/main.dart` | 实现推送计划、仓库状态检查和发布流程接入 |
| 修改 | `/Users/zzz/code/myblog/blog-desktop/test/widget_test.dart` | 测试首次推送、后续推送和非法状态 |
| 新建 | `/Users/zzz/code/myblog/hexo-blog/docs/blog-desktop/publish-upstream/checklist.md` | 定义验收和回归检查 |

## T1: 增加推送决策模型

**文件：** `/Users/zzz/code/myblog/blog-desktop/lib/main.dart`

**依赖：** 无

**步骤：**

1. 增加一个只依赖仓库状态的推送计划模型或纯函数。
2. 输入当前分支、默认远程是否存在和 upstream 是否存在。
3. 有 upstream 时生成普通 `git push` 参数。
4. 无 upstream 时生成 `git push --set-upstream origin <当前分支>` 参数。
5. 对空分支名或缺少默认远程返回可被界面展示的错误。

**验证：** 运行新增单元测试，确认两种推送参数和两类非法状态均正确。

## T2: 接入发布流程

**文件：** `/Users/zzz/code/myblog/blog-desktop/lib/main.dart`

**依赖：** T1

**步骤：**

1. 在 Git 命令服务中读取当前分支名称。
2. 检查 `origin` 是否可用。
3. 查询当前分支是否存在 upstream。
4. 根据推送计划执行普通推送或首次设置 upstream 的推送。
5. 保留现有构建、暂存和提交顺序。
6. 保留推送失败时的本地提交和文章文件，不设置成功状态。

**验证：** 通过代码检查确认只有用户确认发布后才进入推送方法，并确认没有 `--force` 或重置命令。

## T3: 补充 Git 决策测试

**文件：** `/Users/zzz/code/myblog/blog-desktop/test/widget_test.dart`

**依赖：** T1

**步骤：**

1. 测试已有 upstream 返回普通 `push` 参数。
2. 测试没有 upstream 返回 `--set-upstream origin <branch>` 参数。
3. 测试 detached HEAD 和缺少 `origin` 返回失败结果。
4. 保留现有文章、随心记和 Markdown 编辑器测试。

**验证：** 运行 `flutter test`，所有测试通过。

## T4: 编写验收清单

**文件：** `/Users/zzz/code/myblog/hexo-blog/docs/blog-desktop/publish-upstream/checklist.md`

**依赖：** T1、T2、T3

**步骤：**

1. 将 spec 中的 AC1-AC6 转换为可观察检查项。
2. 增加 Flutter 分析和 macOS 构建检查。
3. 增加临时 bare remote + 本地仓库的首次推送和后续推送场景。
4. 增加推送失败后本地提交仍存在的检查。

**验证：** 清单中的每项都有命令或可观察结果，不依赖未经记录的假设。

## T5: 实现后验证

**文件：** `/Users/zzz/code/myblog/blog-desktop/`、临时 Git 测试目录

**依赖：** T2、T3、T4

**步骤：**

1. 运行 `flutter test`。
2. 运行 `flutter analyze`。
3. 运行 `flutter build macos`。
4. 创建临时 bare remote 和未配置 upstream 的本地分支，验证首次推送后跟踪关系存在。
5. 再次提交并验证后续推送使用已有 upstream。
6. 检查当前 `hexo-blog` 的本地提交和文章文件没有被重置或删除。

**验证：** 按 `checklist.md` 记录每项通过或失败证据；不对用户的 GitHub 远程执行新的推送。

## 执行顺序

T1 -> T2 -> T3 -> T4 -> T5
