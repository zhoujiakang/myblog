# zzZ Blog Studio (Flutter)

This is the native Flutter macOS client. It stores one private Hexo workspace at:

`~/Library/Application Support/zzZ Blog Studio/blog`

The first launch creates the workspace and a Butterfly starter configuration. Later launches reuse the same folder without asking the user to select a project.

Run locally with `flutter run -d macos`. A complete Xcode installation is required for macOS builds.
