import 'dart:convert';
import 'dart:io';

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';

void main() => runApp(const BlogStudioApp());

class Note {
  Note({
    required this.id,
    required this.title,
    required this.content,
    required this.updatedAt,
  });
  final String id;
  String title;
  String content;
  String updatedAt;
  factory Note.fromJson(Map<String, dynamic> json) => Note(
    id: '${json['id']}',
    title: '${json['title'] ?? ''}',
    content: '${json['content'] ?? ''}',
    updatedAt: '${json['updatedAt'] ?? ''}',
  );
  Map<String, dynamic> toJson() => {
    'id': id,
    'title': title,
    'content': content,
    'updatedAt': updatedAt,
  };
}

class Article {
  Article({
    required this.file,
    required this.title,
    required this.content,
    required this.draft,
  });
  final File file;
  String title;
  String content;
  final bool draft;
}

class BlogRepository {
  late final Directory root;
  late final Directory privateDir;
  Future<void> init() async {
    final home = Platform.environment['HOME'] ?? Directory.current.path;
    root = Directory('$home/Library/Application Support/zzZ Blog Studio/blog');
    privateDir = Directory('${root.path}/.blog-studio');
    await Directory('${root.path}/source/_posts').create(recursive: true);
    await Directory('${root.path}/source/_drafts').create(recursive: true);
    await privateDir.create(recursive: true);
    const templates = <String>[
      '_config.yml',
      '_config.butterfly.yml',
      'package.json',
      '.gitignore',
      '.github/workflows/pages.yml',
    ];
    for (final relative in templates) {
      final destination = File('${root.path}/$relative');
      if (!await destination.exists()) {
        await destination.parent.create(recursive: true);
        await destination.writeAsString(
          await rootBundle.loadString('assets/template/$relative'),
        );
      }
    }
    if (!await Directory('${root.path}/.git').exists()) {
      await Process.run('git', [
        'init',
        '--initial-branch=main',
      ], workingDirectory: root.path);
    }
  }

  File get notesFile => File('${privateDir.path}/notes.json');
  File get keyFile => File('${privateDir.path}/deepseek.json');
  Future<List<Note>> notes() async {
    if (!await notesFile.exists()) return [];
    final raw = jsonDecode(await notesFile.readAsString()) as List;
    return raw
        .map((item) => Note.fromJson(Map<String, dynamic>.from(item)))
        .toList();
  }

  Future<void> saveNotes(List<Note> items) => notesFile.writeAsString(
    jsonEncode(items.map((item) => item.toJson()).toList()),
  );
  Future<List<Article>> articles() async {
    final result = <Article>[];
    for (final entry in <(String, bool)>[
      ('source/_posts', false),
      ('source/_drafts', true),
    ]) {
      final dir = Directory('${root.path}/${entry.$1}');
      if (!await dir.exists()) continue;
      await for (final entity in dir.list()) {
        if (entity is! File || !entity.path.endsWith('.md')) continue;
        final text = await entity.readAsString();
        final title =
            RegExp(
              r'^title:\s*(.*)$',
              multiLine: true,
            ).firstMatch(text)?.group(1)?.trim() ??
            _name(entity.path);
        final body = text
            .replaceFirst(RegExp(r'^---[\s\S]*?---\s*'), '')
            .trim();
        result.add(
          Article(
            file: entity,
            title: title.replaceAll(RegExp(r'''["']'''), ''),
            content: body,
            draft: entry.$2,
          ),
        );
      }
    }
    return result..sort((a, b) => a.title.compareTo(b.title));
  }

  String _name(String path) => path
      .split(Platform.pathSeparator)
      .last
      .replaceFirst(RegExp(r'\.md$'), '');
  Future<void> saveArticle({
    required String title,
    required String content,
    required bool draft,
  }) async {
    final slug = title
        .trim()
        .replaceAll(RegExp(r'[^\w\u4e00-\u9fff -]'), '')
        .replaceAll(RegExp(r'\s+'), '-');
    final dir = Directory(
      '${root.path}/source/${draft ? '_drafts' : '_posts'}',
    );
    await dir.create(recursive: true);
    await File(
      '${dir.path}/${slug.isEmpty ? 'untitled' : slug}.md',
    ).writeAsString(
      '---\ntitle: $title\ndate: ${DateTime.now().toIso8601String()}\ntags: []\ncategories: []\n---\n\n$content\n',
    );
  }

  Future<String?> apiKey() async {
    if (!await keyFile.exists()) return null;
    final value = jsonDecode(await keyFile.readAsString())['apiKey'];
    return value is String ? value.trim() : null;
  }

  Future<void> saveApiKey(String key) =>
      keyFile.writeAsString(jsonEncode({'apiKey': key.trim()}));
  Future<String> publish() async {
    final add = await Process.run('git', [
      'add',
      '-A',
    ], workingDirectory: root.path);
    if (add.exitCode != 0) throw Exception(add.stderr);
    await Process.run('git', [
      'commit',
      '-m',
      '更新博客内容',
    ], workingDirectory: root.path);
    final push = await Process.run('git', [
      'push',
    ], workingDirectory: root.path);
    if (push.exitCode != 0) throw Exception('${push.stderr}'.trim());
    return '已发布到 GitHub';
  }
}

class BlogStudioApp extends StatelessWidget {
  const BlogStudioApp({super.key});
  @override
  Widget build(BuildContext context) => MaterialApp(
    debugShowCheckedModeBanner: false,
    title: 'zzZ Blog Studio',
    theme: ThemeData(
      colorScheme: ColorScheme.fromSeed(
        seedColor: const Color(0xff167d6a),
        brightness: Brightness.dark,
      ),
      useMaterial3: true,
    ),
    home: const StudioPage(),
  );
}

class StudioPage extends StatefulWidget {
  const StudioPage({super.key});
  @override
  State<StudioPage> createState() => _StudioPageState();
}

class _StudioPageState extends State<StudioPage> {
  final repo = BlogRepository();
  final title = TextEditingController();
  final content = TextEditingController();
  final noteTitle = TextEditingController();
  final noteContent = TextEditingController();
  List<Note> notes = [];
  List<Article> articles = [];
  int section = 0;
  String? selectedNote;
  Article? selectedArticle;
  bool busy = true;
  String status = '正在打开本地博客';

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    try {
      await repo.init();
      notes = await repo.notes();
      articles = await repo.articles();
    } catch (e) {
      status = '$e';
    }
    if (mounted) setState(() => busy = false);
  }

  void _selectNote(Note note) {
    selectedNote = note.id;
    noteTitle.text = note.title;
    noteContent.text = note.content;
    setState(() {});
  }

  void _selectArticle(Article article) {
    selectedArticle = article;
    title.text = article.title;
    content.text = article.content;
    setState(() {});
  }

  Future<void> _saveNote() async {
    final now = DateTime.now().toIso8601String();
    final existing = notes.where((item) => item.id == selectedNote).firstOrNull;
    if (existing == null) {
      final note = Note(
        id: now,
        title: noteTitle.text,
        content: noteContent.text,
        updatedAt: now,
      );
      notes.insert(0, note);
      selectedNote = note.id;
    } else {
      existing.title = noteTitle.text;
      existing.content = noteContent.text;
      existing.updatedAt = now;
    }
    await repo.saveNotes(notes);
    setState(() => status = '随心记已保存');
  }

  Future<void> _saveArticle() async {
    await repo.saveArticle(
      title: title.text,
      content: content.text,
      draft: true,
    );
    articles = await repo.articles();
    setState(() => status = '文章草稿已保存');
  }

  Future<void> _organize() async {
    final key = await repo.apiKey();
    if (key == null || key.isEmpty) {
      await _settings();
      return;
    }
    final selected = notes
        .where((item) => item.id == selectedNote)
        .map((item) => '标题：${item.title}\n${item.content}')
        .join('\n\n');
    if (selected.trim().isEmpty) return;
    setState(() => status = 'DeepSeek 正在整理');
    final client = HttpClient();
    try {
      final request = await client.postUrl(
        Uri.parse('https://api.deepseek.com/chat/completions'),
      );
      request.headers.set(HttpHeaders.authorizationHeader, 'Bearer $key');
      request.headers.contentType = ContentType.json;
      request.write(
        jsonEncode({
          'model': 'deepseek-chat',
          'messages': [
            {
              'role': 'system',
              'content': '把碎片整理为一篇中文 Markdown 文章，只返回 JSON：{"title":"标题","content":"正文"}',
            },
            {'role': 'user', 'content': selected},
          ],
        }),
      );
      final response = await request.close();
      final json = jsonDecode(await response.transform(utf8.decoder).join());
      final value = json['choices'][0]['message']['content'] as String;
      final clean = value
          .replaceFirst(RegExp(r'^```json\s*'), '')
          .replaceFirst(RegExp(r'\s*```$'), '');
      final article = jsonDecode(clean);
      title.text = article['title'] ?? 'AI 整理文章';
      content.text = article['content'] ?? '';
      section = 1;
      status = 'AI 整理完成，请人工修改后保存';
      setState(() {});
    } catch (e) {
      setState(() => status = 'AI 整理失败：$e');
    } finally {
      client.close();
    }
  }

  Future<void> _settings() async {
    final controller = TextEditingController();
    final saved = await repo.apiKey();
    if (!mounted) return;
    await showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('DeepSeek 设置'),
        content: TextField(
          controller: controller,
          obscureText: true,
          decoration: InputDecoration(
            hintText: saved == null ? '输入 API Key' : '已配置，输入新 Key 覆盖',
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('取消'),
          ),
          FilledButton(
            onPressed: () async {
              if (controller.text.trim().isNotEmpty) {
                await repo.saveApiKey(controller.text);
              }
              if (context.mounted) Navigator.pop(context);
            },
            child: const Text('保存'),
          ),
        ],
      ),
    );
  }

  Future<void> _publish() async {
    try {
      setState(() => status = '正在发布');
      status = await repo.publish();
    } catch (e) {
      status = '发布失败：$e';
    }
    setState(() {});
  }

  @override
  Widget build(BuildContext context) {
    if (busy) {
      return const Scaffold(body: Center(child: CircularProgressIndicator()));
    }
    final list = section == 0 ? notes : articles;
    return Scaffold(
      body: Row(
        children: [
          NavigationRail(
            selectedIndex: section,
            onDestinationSelected: (index) => setState(() => section = index),
            labelType: NavigationRailLabelType.all,
            destinations: const [
              NavigationRailDestination(
                icon: Icon(Icons.notes),
                label: Text('随心记'),
              ),
              NavigationRailDestination(
                icon: Icon(Icons.article_outlined),
                label: Text('文章'),
              ),
            ],
          ),
          SizedBox(
            width: 280,
            child: Column(
              children: [
                ListTile(
                  title: const Text(
                    'zzZ Blog Studio',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  subtitle: Text(
                    repo.root.path,
                    maxLines: 1,
                    overflow: TextOverflow.ellipsis,
                  ),
                ),
                FilledButton.icon(
                  onPressed: () {
                    if (section == 0) {
                      selectedNote = null;
                      noteTitle.clear();
                      noteContent.clear();
                    } else {
                      selectedArticle = null;
                      title.clear();
                      content.clear();
                    }
                    setState(() {});
                  },
                  icon: const Icon(Icons.add),
                  label: Text(section == 0 ? '记录随心记' : '新建文章'),
                ),
                Expanded(
                  child: ListView.builder(
                    itemCount: list.length,
                    itemBuilder: (context, index) {
                      final item = list[index];
                      final active = section == 0
                          ? (item as Note).id == selectedNote
                          : (item as Article) == selectedArticle;
                      return ListTile(
                        selected: active,
                        title: Text(
                          section == 0
                              ? ((item as Note).title.isEmpty
                                    ? '未命名随心记'
                                    : item.title)
                              : (item as Article).title,
                        ),
                        subtitle: Text(
                          section == 0
                              ? '随心记'
                              : ((item as Article).draft ? '草稿' : '已发布'),
                        ),
                        onTap: () => section == 0
                            ? _selectNote(item as Note)
                            : _selectArticle(item as Article),
                      );
                    },
                  ),
                ),
              ],
            ),
          ),
          Expanded(
            child: Column(
              children: [
                AppBar(
                  title: Text(section == 0 ? '随心记' : '文章编辑'),
                  actions: [
                    if (section == 0)
                      IconButton(
                        onPressed: _settings,
                        icon: const Icon(Icons.key),
                        tooltip: 'DeepSeek 设置',
                      ),
                    if (section == 0)
                      FilledButton.icon(
                        onPressed: _organize,
                        icon: const Icon(Icons.auto_awesome),
                        label: const Text('AI 整理'),
                      ),
                    IconButton(
                      onPressed: section == 0 ? _saveNote : _saveArticle,
                      icon: const Icon(Icons.save),
                      tooltip: '保存',
                    ),
                    if (section == 1)
                      IconButton(
                        onPressed: _publish,
                        icon: const Icon(Icons.publish),
                        tooltip: '发布',
                      ),
                  ],
                ),
                Expanded(
                  child: Padding(
                    padding: const EdgeInsets.all(28),
                    child: section == 0
                        ? Column(
                            children: [
                              TextField(
                                controller: noteTitle,
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineSmall,
                                decoration: const InputDecoration(
                                  hintText: '给随心记起个标题',
                                  border: InputBorder.none,
                                ),
                              ),
                              Expanded(
                                child: TextField(
                                  controller: noteContent,
                                  expands: true,
                                  maxLines: null,
                                  minLines: null,
                                  decoration: const InputDecoration(
                                    hintText: '想到什么就写什么...',
                                    border: InputBorder.none,
                                  ),
                                  textAlignVertical: TextAlignVertical.top,
                                ),
                              ),
                            ],
                          )
                        : Column(
                            children: [
                              TextField(
                                controller: title,
                                style: Theme.of(context)
                                    .textTheme
                                    .headlineSmall,
                                decoration: const InputDecoration(
                                  labelText: '文章标题',
                                ),
                              ),
                              const SizedBox(height: 18),
                              Expanded(
                                child: TextField(
                                  controller: content,
                                  expands: true,
                                  maxLines: null,
                                  minLines: null,
                                  decoration: const InputDecoration(
                                    hintText: 'Markdown 正文',
                                    border: OutlineInputBorder(),
                                  ),
                                  textAlignVertical: TextAlignVertical.top,
                                ),
                              ),
                            ],
                          ),
                  ),
                ),
                Align(
                  alignment: Alignment.centerLeft,
                  child: Padding(
                    padding: const EdgeInsets.all(12),
                    child: Text(
                      status,
                      style: Theme.of(context).textTheme.bodySmall,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
