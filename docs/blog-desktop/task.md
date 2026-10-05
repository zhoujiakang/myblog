# 博客桌面管理器 Tasks

## 文件清单

| 操作 | 文件 | 职责 |
|---|---|---|
| 新建 | `/Users/zzz/code/myblog/blog-desktop/pubspec.yaml` | Flutter 应用元数据和依赖 |
| 新建 | `/Users/zzz/code/myblog/blog-desktop/lib/main.dart` | 应用入口 |
| 新建 | `/Users/zzz/code/myblog/blog-desktop/lib/domain/` | 项目、文章、Git 和操作状态模型 |
| 新建 | `/Users/zzz/code/myblog/blog-desktop/lib/application/` | 工作区和业务流程编排 |
| 新建 | `/Users/zzz/code/myblog/blog-desktop/lib/infrastructure/` | 文件、Front Matter、Hexo、Git、预览和设置实现 |
| 新建 | `/Users/zzz/code/myblog/blog-desktop/lib/presentation/` | Flutter 页面、组件、预览侧边栏和状态展示 |
| 新建 | `/Users/zzz/code/myblog/blog-desktop/test/` | 单元测试和基础设施测试 |
| 新建 | `/Users/zzz/code/myblog/blog-desktop/integration_test/` | 桌面端端到端流程测试 |
| 新建 | `/Users/zzz/code/myblog/blog-desktop/README.md` | 运行、依赖和发布说明 |
| 修改 | `/Users/zzz/code/myblog/hexo-blog/docs/blog-desktop/checklist.md` | 实现完成后记录验收结果 |

## T1: 创建 Flutter Desktop 工程

**文件：** `/Users/zzz/code/myblog/blog-desktop/`

**依赖：** 无

**步骤：**

1. 创建 Flutter Desktop 工程并启用 macOS、Windows、Linux 目标。
2. 配置 Dart SDK 约束、Markdown、目录选择、路径和本地设置所需依赖。
3. 保留默认桌面入口并替换示例页面为最小应用壳。

**验证：** 运行 `flutter analyze` 和当前开发平台的 `flutter run`，应用成功启动且无分析错误。

## T2: 定义领域模型和错误类型

**文件：** `lib/domain/`

**依赖：** T1

**步骤：**

1. 定义 `BlogProject`、`PostDocument`、`GitChange`、`PublishSettings` 和 `ProjectOperationState`。
2. 定义项目不存在、非 Hexo 项目、目录非空、依赖缺失、命令失败、Git 冲突和保存失败等错误类型。
3. 为模型添加不可变构造、相等判断和序列化所需能力。

**验证：** 运行领域模型单元测试，覆盖空值、默认值、状态转换和错误分类。

## T3: 实现项目检查和空目录初始化

**文件：** `lib/infrastructure/project/`、`lib/application/workspace/`

**依赖：** T1、T2

**步骤：**

1. 实现已有目录检查，识别 Hexo 配置、文章目录、Node 依赖和 Git 状态。
2. 实现空目录和不存在目录校验，拒绝覆盖包含用户文件的非空目录。
3. 调用 Hexo 初始化命令，并在成功后重新检查项目。
4. 将初始化进度、失败原因和最近项目路径交给工作区状态。

**验证：** 使用临时空目录初始化成功；使用非空目录被拒绝；使用普通目录返回可理解的非 Hexo 错误。

## T4: 实现 Hexo 配置和文章解析

**文件：** `lib/infrastructure/content/`、`lib/domain/post_document.dart`

**依赖：** T2、T3

**步骤：**

1. 读取 Hexo 配置，确定文章目录和站点基本信息。
2. 解析 Markdown 文件的 YAML Front Matter 和正文。
3. 保留未建模 Front Matter 字段，统一处理字符串、日期、列表和布尔值。
4. 对异常 Front Matter 返回文件路径和行文上下文。

**验证：** 使用现有 `hello-world.md` 和包含额外字段的样例文章解析、序列化后内容正确。

## T5: 实现文章列表、创建、编辑和删除

**文件：** `lib/infrastructure/content/`、`lib/application/posts/`

**依赖：** T4

**步骤：**

1. 扫描文章目录并生成按标题、更新时间和草稿状态排序的文章列表。
2. 实现新文章文件名生成和 Front Matter 默认值。
3. 实现保存逻辑，合并编辑字段和未知字段，不覆盖未编辑内容。
4. 实现删除前确认所需的应用层命令和删除失败反馈。

**验证：** 单元测试覆盖创建、更新、未知字段保留、重复文件名和删除失败。

## T6: 实现 Markdown 编辑器和应用内预览

**文件：** `lib/presentation/editor/`、`lib/application/preview/`

**依赖：** T4、T5

**步骤：**

1. 创建文章编辑页面，提供标题、日期、标签、分类、摘要、草稿和正文输入。
2. 提供编辑/预览切换或分栏预览。
3. 接入 Markdown 渲染，支持标题、段落、列表、代码块、链接和图片。
4. 对未保存状态提供明确提示，切换文章或关闭页面前阻止误丢失。

**验证：** Widget 测试验证字段绑定、预览内容和未保存提示；使用样例 Markdown 截图或人工检查布局。

## T7: 实现 Hexo 本地服务器预览

**文件：** `lib/infrastructure/hexo/`、`lib/application/preview/`

**依赖：** T3、T6

**步骤：**

1. 封装 Hexo generate 和 Hexo server 子进程。
2. 捕获标准输出、错误输出和退出码，解析本地访问地址。
3. 管理服务器会话，支持停止、异常退出和重复启动保护。
4. 暴露动态本地 URL 给应用内 WebView，并保留系统浏览器作为降级入口。

**验证：** 在现有博客目录启动服务器，应用内 WebView 能打开博客；停止后端口释放；构建失败显示命令输出摘要。

## T7.1: 集成应用内预览侧边栏

**文件：** `pubspec.yaml`、`lib/presentation/preview/`、`lib/application/preview/`、各桌面平台配置

**依赖：** T6、T7

**步骤：**

1. 引入支持目标桌面的 WebView 依赖或平台实现，并封装统一预览组件。
2. 在工作区或编辑页面增加可收起的右侧预览栏。
3. 将 PreviewSession URL 加载到 WebView，提供刷新、停止和打开系统浏览器操作。
4. 保存文章后刷新 WebView；WebView 不可用或加载失败时展示错误和降级操作。

**验证：** 点击预览后不离开应用窗口，右侧显示 Butterfly 页面；保存文章后刷新能看到最新内容；预览进程失败时不会无限加载。

## T8: 实现 Git 状态和发布流程

**文件：** `lib/infrastructure/git/`、`lib/application/publish/`

**依赖：** T3、T7

**步骤：**

1. 读取当前分支、远程地址和工作区变更。
2. 显示新增、修改、删除和未跟踪文件，并支持选择提交范围。
3. 实现构建、确认、add、commit、push 的阶段状态。
4. 检测未配置凭据、远程访问失败、冲突和推送失败，不执行强制覆盖。
5. 成功后刷新项目状态并展示提交信息和站点地址。

**验证：** 在测试 Git 仓库中验证成功发布、取消发布、构建失败、冲突和推送失败；确认源文件内容不被回滚或覆盖。

## T9: 实现项目设置和安全存储边界

**文件：** `lib/infrastructure/settings/`、`lib/presentation/settings/`

**依赖：** T3、T8

**步骤：**

1. 保存最近项目路径、远程名、分支、提交信息和站点地址。
2. 在设置页面展示检测到的 GitHub Pages 配置并允许修改非敏感字段。
3. 不在普通配置文件或日志中写入 Token、密码或完整凭据输出。
4. 应用启动时恢复最近项目并处理路径失效。

**验证：** 重启应用后恢复项目；检查配置和日志不包含敏感字段；删除或移动项目后显示可恢复错误。

## T10: 完成应用页面和流程串联

**文件：** `lib/presentation/`、`lib/application/`

**依赖：** T5、T6、T7、T8、T9

**步骤：**

1. 创建项目选择页，提供打开已有项目和初始化空目录入口。
2. 创建工作区页，展示项目概览、文章列表、操作状态和错误提示。
3. 串联文章编辑、预览、项目预览、变更检查和发布向导。
4. 为所有异步操作增加加载、成功、失败、取消和重试状态。

**验证：** 在开发平台完成从打开项目到发布的完整手动流程；检查导航不会丢失未保存内容。

## T11: 补充测试、文档和跨平台构建

**文件：** `test/`、`integration_test/`、`README.md`

**依赖：** T10

**步骤：**

1. 增加项目识别、初始化、Front Matter、文章保存、命令执行和 Git 发布单元测试。
2. 增加临时 Hexo 项目的桌面集成流程测试。
3. 编写依赖要求、启动方式、Git 凭据准备和故障排查说明。
4. 分别执行 macOS、Windows、Linux 的分析和 release 构建验证。

**验证：** 运行 `flutter test`、`flutter analyze` 和各平台 `flutter build`；记录无法在当前机器执行的平台验证限制。

## 执行顺序

T1 -> T2 -> T3 -> T4 -> T5 -> T6 -> T7 -> T7.1 -> T8 -> T9 -> T10 -> T11
