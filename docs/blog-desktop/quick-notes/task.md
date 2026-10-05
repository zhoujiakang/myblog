# 随心记 Tasks

## 文件清单

| 操作 | 文件 | 职责 |
|---|---|---|
| 新建 | `/Users/zzz/code/myblog/blog-desktop/lib/quick_notes.dart` | 随心记模型、Front Matter 标题同步、Markdown 文件仓库和整理逻辑 |
| 修改 | `/Users/zzz/code/myblog/blog-desktop/lib/main.dart` | 工作区导航、随心记页面、所见即所得编辑器、自动保存和文章整理入口 |
| 新建 | `/Users/zzz/code/myblog/blog-desktop/lib/rich_markdown_editor.dart` | Flutter Quill 编辑器与 Markdown 双向转换组件 |
| 修改 | `/Users/zzz/code/myblog/blog-desktop/pubspec.yaml` | 富文本编辑器和 Markdown 双向转换依赖 |
| 新建 | `/Users/zzz/code/myblog/blog-desktop/test/quick_notes_test.dart` | 随心记文件、Front Matter 和文章整理测试 |
| 修改 | `/Users/zzz/code/myblog/hexo-blog/docs/blog-desktop/quick-notes/checklist.md` | 记录模块验收结果 |

## T1: 定义随心记模型和 Markdown 解析规则

**文件：** `lib/quick_notes.dart`

**依赖：** 无

**步骤：**

1. 定义 `QuickNote`，保存文件路径、完整 Markdown、Front Matter 和更新时间。
2. 解析可选 YAML Front Matter 和正文。
3. 从正文中找到第一个一级标题。
4. 将一级标题同步到 Front Matter 的 `title` 字段，同时保留正文标题。
5. 保留未建模的 Front Matter 字段；无标题时使用“未命名随心记”作为显示标题。

**验证：** 使用带标题、无标题、带标签和未知字段的 Markdown 样例测试解析与序列化；确认正文标题和未知字段均保留。

## T2: 实现随心记文件仓库

**文件：** `lib/quick_notes.dart`

**依赖：** T1

**步骤：**

1. 将存储目录固定为 `<blogRoot>/.blog-desk/notes/`。
2. 实现目录准备、Markdown 列表读取、单条读取、原子保存和删除。
3. 使用稳定 ID 作为文件名，避免使用用户标题生成路径。
4. 按文件修改时间倒序返回记录。
5. 处理损坏 Markdown、无权限、缺失目录和临时文件清理错误。

**验证：** 在临时博客目录中创建、读取、修改和删除记录；确认 `source/_posts` 不发生变化，并验证写入失败不会留下半截正式文件。

## T3: 接入工作区导航和所见即所得编辑页面

**文件：** `lib/main.dart`

**依赖：** T1、T2

**步骤：**

1. 在已绑定项目的主导航中增加“随心记”入口。
2. 进入页面后加载 `.blog-desk/notes/`，默认提供所见即所得编辑区。
3. 新建记录时立即创建草稿文件，默认内容为 `# ` 或空 Markdown。
4. 编辑停顿后将富文本内容转换为 Markdown 自动保存，并显示保存中、已保存和保存失败状态。
5. 列表显示 Front Matter `title`、正文摘要和文件更新时间。
6. 支持打开记录、切换记录、删除记录和删除确认。

**验证：** Widget 测试确认进入页面可直接格式化输入；修改内容后自动保存为 Markdown；重启或重新加载项目后记录仍显示。

## T4: 实现随心记整理文章

**文件：** `lib/quick_notes.dart`、`lib/main.dart`

**依赖：** T1、T2、T3

**步骤：**

1. 支持列表多选，并在没有选择记录时禁用整理操作。
2. 按用户选择顺序读取最新记录并合并 Markdown 内容。
3. 创建独立的正式文章草稿，默认使用随心记标题和当前时间。
4. 复用现有文章编辑器，允许用户修改正式文章 Front Matter 和正文。
5. 用户确认保存后写入 `source/_posts`，不删除、不覆盖随心记。
6. 整理失败时保留原随心记和未保存的文章草稿。

**验证：** 选择一条和多条记录分别整理，确认生成新的 Hexo Markdown 文章、原记录仍存在，取消保存不会写入文章目录。

## T5: 补充异常处理和目录隔离

**文件：** `lib/quick_notes.dart`、`lib/main.dart`

**依赖：** T2、T3、T4

**步骤：**

1. 对损坏 Front Matter、无效文件、目录不可写和文章保存失败显示可理解错误。
2. 确认随心记读写只访问 `.blog-desk/notes/`。
3. 确认随心记操作不触发 Git 发布、不修改 Hexo 配置、不修改 `source/_posts`。
4. 防止自动保存与删除、切换记录操作产生竞态写入。

**验证：** 构造损坏文件和写入失败场景，确认原文件内容不被覆盖，错误状态可恢复。

## T6: 完成模块回归验证

**文件：** `test/quick_notes_test.dart`、`test/widget_test.dart`

**依赖：** T1-T5

**步骤：**

1. 添加 Front Matter 标题同步和 Markdown/富文本文档转换测试。
2. 添加 Markdown 文件保存、排序、删除和目录隔离测试。
3. 添加自动保存和整理文章行为测试。
4. 运行格式化、单元测试、静态分析和 macOS 构建。
5. 按 `checklist.md` 记录通过项和环境限制。

**验证：** `dart format lib test`、`flutter test`、`flutter analyze` 和 `flutter build macos` 均完成；已有博客文章测试不回归。

## 执行顺序

T1 -> T2 -> T3 -> T4 -> T5 -> T6
