# 草稿文章发布转换 Tasks

## 文件清单

| 操作 | 文件 | 职责 |
|---|---|---|
| 修改 | `/Users/zzz/code/myblog/blog-desktop/lib/main.dart` | 实现选中文章判断、草稿转换确认、转换快照和发布流程接入 |
| 修改 | `/Users/zzz/code/myblog/blog-desktop/test/widget_test.dart` | 覆盖草稿取消、草稿转正、非草稿路径、字段正文保留和推送计划 |
| 修改 | `/Users/zzz/code/myblog/hexo-blog/docs/blog-desktop/draft-publish/checklist.md` | 记录完整验收结果 |

## T1: 固化草稿转换规则

**文件：** `/Users/zzz/code/myblog/blog-desktop/lib/main.dart`

**依赖：** 无

**步骤：**

1. 检查现有 `PostDocument` 的解析和序列化行为。
2. 增加将选中文章转换为正式文章的最小操作。
3. 确保转换移除 `draft: true`，不删除其他 Front Matter 字段或正文。
4. 增加构建失败所需的原文快照恢复能力。

**验证：** 单元测试确认草稿转换前后字段和正文内容不变，且正式序列化结果无 `draft: true`。

## T1.5: 增加远程跟踪状态检测

**文件：** `/Users/zzz/code/myblog/blog-desktop/lib/main.dart`

**依赖：** 无

**步骤：**

1. 在绑定博客目录或配置远程仓库时读取当前分支、`origin` 和 upstream。
2. 没有 upstream 时记录一次性初始化推送待处理状态。
3. 检测过程不执行推送，不修改文件，不绕过发布确认。
4. 首次 `--set-upstream` 推送成功后清除待处理状态；后续发布只使用普通 `push`。

**验证：** 单元测试和临时 bare remote 验证首次带 `--set-upstream`、后续不带 `-u`。

## T2: 接入草稿发布确认

**文件：** `/Users/zzz/code/myblog/blog-desktop/lib/main.dart`

**依赖：** T1、T1.5

**步骤：**

1. 发布入口没有选中文章时直接返回。
2. 草稿文章先显示指定提示和两个操作按钮。
3. 取消时不写文件、不构建、不提交、不推送。
4. 确认后转换当前文章并直接进入构建、提交、推送流水线。
5. 非草稿文章跳过转换提示，进入普通确认后再执行流水线。

**验证：** Widget 或发布编排测试确认各分支的对话框和副作用顺序。

## T3: 保持发布失败边界

**文件：** `/Users/zzz/code/myblog/blog-desktop/lib/main.dart`

**依赖：** T2

**步骤：**

1. 转换后执行 Hexo generate、git add、git commit 和按远程检测状态选择的 push。
2. Hexo generate 失败时恢复快照并保持草稿。
3. Git 提交或推送失败时保留本地文件和本地提交，不执行 reset、回滚或 force push。
4. 仅在 push 返回成功后设置“发布成功”。
5. 成功后重新加载文章列表。

**验证：** 使用可控命令结果或临时仓库测试成功、构建失败和推送失败场景。

## T4: 补充回归测试

**文件：** `/Users/zzz/code/myblog/blog-desktop/test/widget_test.dart`

**依赖：** T1、T2、T3

**步骤：**

1. 测试草稿取消发布时内容和草稿状态不变。
2. 测试确认发布后移除 `draft: true`。
3. 测试非草稿不触发转换提示的决策。
4. 测试其他 Front Matter 和正文保留。
5. 测试只有推送成功才产生成功结果。
6. 测试绑定目录检测 upstream 缺失时首次使用 `--set-upstream`，成功后后续使用普通 `push`；保留现有文章、随心记、Markdown 编辑器测试。

**验证：** 运行 `flutter test`，所有测试通过。

## T5: 完整验收

**文件：** `/Users/zzz/code/myblog/blog-desktop/`、临时 Git 测试目录

**依赖：** T3、T4

**步骤：**

1. 运行 `flutter test`。
2. 运行 `flutter analyze`。
3. 运行 `flutter build macos`。
4. 使用临时仓库验证首次 upstream 推送，不触碰真实 GitHub remote。
5. 检查代码不包含 force push、git reset 或自动回滚。
6. 按验收清单记录每项实际结果。

**验证：** 测试、分析和构建命令均成功；真实 GitHub remote 没有新增 push。

## 执行顺序

T1 -> T1.5 -> T2 -> T3 -> T4 -> T5
