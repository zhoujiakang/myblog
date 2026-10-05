# 博客桌面管理器 Plan

## 架构概览

应用采用 Flutter Desktop + Dart 的分层结构：

1. 表现层：负责项目选择、文章列表、编辑器、应用内预览侧边栏、发布向导和状态反馈。
2. 应用层：负责工作区状态、文章编辑流程、初始化流程、预览流程和发布流程编排。
3. 领域层：定义博客项目、文章、Front Matter、Git 变更和任务状态等模型，并提供格式校验。
4. 基础设施层：负责本地文件读写、Hexo 命令、Git 命令、应用内 WebView、系统浏览器、偏好设置和安全凭据访问。

所有耗时操作通过异步接口执行，并向应用层报告阶段、输出摘要和错误。表现层只消费状态，不直接执行文件或进程操作。

## 核心数据结构

### `BlogProject`

- `rootPath`：本地博客根目录。
- `siteTitle`：从 Hexo 配置读取的站点标题。
- `postsPath`：文章目录，默认来自 Hexo 配置或 `source/_posts`。
- `hexoVersion`：检测到的 Hexo 版本。
- `gitBranch`：当前 Git 分支。
- `gitStatus`：工作区状态摘要。
- `siteUrl`：配置的博客访问地址。
- `isInitialized`：项目是否已完成 Hexo 初始化。

### `PostDocument`

- `filePath`：文章相对项目根目录的路径。
- `title`：文章标题。
- `date`：文章日期。
- `tags`：标签列表。
- `categories`：分类列表。
- `description`：摘要。
- `draft`：是否为草稿。
- `frontMatterExtras`：未被编辑器专门建模的 Front Matter 字段。
- `body`：Markdown 正文。
- `modifiedAt`：文件更新时间。

### `ProjectOperationState`

- `phase`：空闲、检测中、初始化中、保存中、预览中、构建中、提交中、推送中、成功或失败。
- `message`：展示给用户的当前阶段说明。
- `output`：经过截断和脱敏的命令输出。
- `error`：可操作的错误信息。
- `canCancel`：当前操作是否可以取消。

### `GitChange`

- `path`：变更文件路径。
- `kind`：新增、修改、删除、重命名或未跟踪。
- `isSelected`：是否纳入本次提交。

### `PublishSettings`

- `remoteName`：默认 `origin`，允许修改。
- `branchName`：推送分支。
- `commitMessage`：提交信息模板或本次提交信息。
- `siteUrl`：发布成功后的访问地址。
- `deployCommand`：项目已有部署命令的检测结果，默认采用 Git 提交流程并兼容现有 Hexo 配置。

### `PreviewSession`

- `process`：Hexo server 子进程句柄。
- `url`：本次预览使用的本地地址和动态端口。
- `status`：启动中、就绪、失败或已停止。
- `lastRefreshAt`：最近一次 WebView 刷新时间。

## 接口

### `ProjectRepository`

- `inspect(path) -> BlogProject`
  - 检查目录、Hexo 配置、文章目录、Node 依赖和 Git 状态。
  - 不是 Hexo 项目时返回分类错误，不修改目录。
- `initializeEmpty(path, options) -> BlogProject`
  - 只接受空目录或不存在的目录。
  - 调用 Hexo 初始化命令，完成依赖和基础配置检查后返回项目。
- `loadRecentProject() -> String?`
  - 从非敏感偏好设置读取最近项目路径。

### `PostRepository`

- `list(project) -> List<PostDocument>`
- `read(project, filePath) -> PostDocument`
- `create(project, draft) -> PostDocument`
- `update(project, document) -> PostDocument`
- `delete(project, filePath) -> void`

Front Matter 使用 YAML 解析和序列化；保存时保留未知字段，并使用稳定的日期、列表和布尔值格式。删除操作由应用层先确认，再执行实际删除。

### `HexoService`

- `generate(project) -> OperationResult`
  - 执行 Hexo 生成命令，返回退出码、输出摘要和生成目录。
- `startServer(project) -> PreviewSession`
  - 启动本地服务器，监听输出中的地址和端口。
- `stopServer(session) -> void`
- `init(projectPath, options) -> BlogProject`
  - 执行项目初始化命令并检查初始化结果。

### `GitService`

- `status(project) -> List<GitChange>`
- `readSettings(project) -> PublishSettings`
- `publish(project, settings, selectedChanges) -> PublishResult`
  - 先验证工作区、远程地址和分支，再执行 add、commit、push。
  - 不自动覆盖冲突或重置用户变更。
- `cancelActiveOperation() -> void`

### `PreviewService`

- `renderMarkdown(document) -> RenderedMarkdown`
- `startEmbeddedPreview(project) -> PreviewSession`
- `refreshEmbeddedPreview(session) -> void`
- `stopEmbeddedPreview(session) -> void`
- `openLocalSite(url) -> void`
- `openPublishedSite(url) -> void`

Markdown 编辑预览在应用内渲染；完整 Hexo 主题预览通过本地服务器和桌面 WebView 嵌入编辑页右侧。系统浏览器只作为 WebView 不可用时的降级方式。

### `SettingsStore`

- `load() -> AppSettings`
- `save(settings) -> void`
- `deleteSensitiveData() -> void`

项目路径、窗口偏好和最近使用设置使用本地偏好存储；Git 凭据不进入该存储，由系统 Git credential helper 或平台安全存储负责。

## 模块设计

### 项目工作区模块

提供“打开已有项目”和“从空目录创建项目”两个入口。选择路径后先做只读检查，确认目录状态，再允许绑定或初始化。初始化步骤失败时将错误返回到向导，不继续进入编辑界面。

### 文章模块

加载 `source/_posts` 下的 Markdown 文件，解析 Front Matter 和正文。编辑器将常用字段单独展示，额外字段保存在 `frontMatterExtras` 中，保存时合并回原文。列表支持标题、更新时间和草稿状态筛选。

### 预览模块

编辑器提供 Markdown 渲染预览；项目预览调用 Hexo server，记录子进程生命周期和实际访问端口。服务器返回成功响应后，右侧 WebView 加载本地页面。保存文章后提供刷新操作，并在预览服务异常退出时自动把状态改为失败，展示命令输出摘要。WebView 组件通过平台适配器隔离 macOS、Windows 和 Linux 的差异。

### 应用内 WebView 模块

提供加载本地 HTTP 地址、刷新、停止加载、加载失败和打开系统浏览器等能力。WebView 只允许访问当前本地预览地址和博客所需的静态资源，不保存登录凭据，不承担远程仓库认证。

### 发布模块

发布向导包含变更检查、构建、提交和推送四个阶段。用户必须在变更列表中确认后才允许推送。所有阶段使用统一的 `ProjectOperationState`，失败时保留日志和源文件，不执行回滚或强制覆盖。

### 命令执行模块

用 Dart `Process`/`Process.start` 统一执行 Node、Hexo 和 Git 命令，设置项目根目录为工作目录，分别收集标准输出和错误输出。命令路径、退出码和输出格式由适配器封装，便于为 Windows、macOS 和 Linux 提供平台差异处理。

## 模块交互

### 打开已有项目

路径选择 -> `ProjectRepository.inspect` -> 读取 Hexo 配置和 Git 状态 -> 创建工作区状态 -> 加载文章列表。

### 从空目录创建项目

路径选择 -> 空目录校验 -> 用户确认初始化 -> `HexoService.init` -> 再次检查项目 -> 保存最近项目 -> 加载文章列表。

### 编辑和预览

打开文章 -> `PostRepository.read` -> 编辑状态 -> 文本变化触发 Markdown 预览 -> 用户保存时 `PostRepository.update` -> 刷新 Git 变更。用户启动博客预览时，`PreviewService` 启动 Hexo server -> 等待 HTTP 就绪 -> WebView 加载动态 URL；用户保存或点击刷新时 WebView 重新加载。

### 发布

刷新 Git 状态 -> 展示变更 -> 用户确认 -> `HexoService.generate` -> `GitService.publish` -> 刷新项目状态 -> 展示提交信息和站点地址。

任意阶段失败都进入失败状态，不清除编辑器状态，不覆盖源文件，不自动重试推送。

## 文件组织

Flutter 应用作为独立目录放在博客仓库之外，避免桌面应用源码参与 Hexo 内容发布：

```text
/Users/zzz/code/myblog/
├── hexo-blog/
│   └── docs/blog-desktop/
│       ├── spec.md
│       ├── plan.md
│       ├── task.md
│       └── checklist.md
└── blog-desktop/
    ├── lib/
    │   ├── main.dart
    │   ├── app/
    │   ├── domain/
    │   ├── application/
    │   ├── infrastructure/
    │   └── presentation/
    ├── test/
    ├── integration_test/
    ├── pubspec.yaml
    └── README.md
```

基础设施层按职责拆分为 `filesystem`, `hexo`, `git`, `preview` 和 `settings`；表现层按项目工作区、文章编辑、预览侧边栏和发布页面拆分。实际包名和目录细节在任务拆解阶段固定。

## 技术决策

| 决策点 | 选择 | 理由 |
|---|---|---|
| 桌面框架 | Flutter Desktop | 一套代码覆盖 macOS、Windows、Linux，适合构建长期演进的桌面界面。 |
| 本地项目操作 | Dart `dart:io` + 命令适配器 | 能直接处理文件和本地进程，避免把博客逻辑绑定到某个远程服务。 |
| 文章格式 | 保留 Markdown + YAML Front Matter | 与现有 Hexo 项目兼容，不要求迁移文章。 |
| 完整博客预览 | 启动 Hexo server 后通过桌面 WebView 嵌入编辑页右侧 | 可以真实使用 Butterfly 主题，同时保持编辑和预览在同一应用窗口；WebView 失败时降级到系统浏览器。 |
| 编辑预览 | Flutter 内 Markdown 渲染 | 编辑时反馈快，支持左右分栏或切换预览模式。 |
| GitHub 发布 | 本机 Git 命令和凭据助手 | 不在应用中保存 GitHub Token，兼容用户已有 SSH 或 credential helper 配置。 |
| 状态管理 | 单向状态流 + 明确的操作状态模型 | 便于处理长任务、取消、失败和重试，并可独立测试。 |
| 远程仓库 | 预留接口，不在第一阶段实现 | 满足当前本地目录模式，避免过早引入 OAuth、远程冲突和同步策略。 |
| WebView 平台支持 | 使用支持目标桌面的 WebView 插件并封装 `EmbeddedPreviewView` | macOS、Windows、Linux 的系统 WebView 能力不同，平台适配层可以控制依赖和降级行为。 |

## 关键风险与处理

- Hexo、Node 或 Git 未安装：项目检查阶段报告缺少依赖和安装建议。
- 不同系统的命令路径和进程终止方式不同：通过命令适配器和平台测试隔离处理。
- 用户已有 Git 未提交变更：发布前完整显示变更，禁止静默覆盖。
- 主题或插件导致 Hexo 构建失败：保留原始命令输出，并将错误定位到构建阶段。
- Front Matter 存在未知字段：解析时保留额外字段，保存时合并回去。
- 桌面 WebView 插件在某个平台不可用：显示预览错误并提供系统浏览器降级入口，不影响文章编辑和发布。
