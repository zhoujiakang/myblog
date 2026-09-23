const { app, BrowserWindow, dialog, Menu, shell } = require('electron')
const { spawn, spawnSync } = require('node:child_process')
const { existsSync } = require('node:fs')
const { cp, mkdir, symlink } = require('node:fs/promises')
const { dirname, join, resolve } = require('node:path')

const isDev = !app.isPackaged
const bundledServer = join(app.getAppPath(), 'tools/blog-admin/server.mjs')
let projectDir
let serverProcess
let mainWindow

function looksLikeBlog(dir) {
  return existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'source'))
}

async function getProjectDir() {
  const userProjectDir = join(app.getPath('userData'), 'blog')
  if (looksLikeBlog(userProjectDir)) return userProjectDir
  if (existsSync(userProjectDir)) {
    throw new Error(`应用博客目录不完整：${userProjectDir}`)
  }

  const templateDir = isDev
    ? resolve(__dirname, '../blog-template')
    : join(process.resourcesPath, 'blog-template')
  if (!looksLikeBlog(templateDir)) throw new Error('应用内置博客模板缺失，请重新安装应用')

  await mkdir(dirname(userProjectDir), { recursive: true })
  await cp(templateDir, userProjectDir, { recursive: true })
  // Hexo looks for themes and plugins from the blog's node_modules directory.
  await symlink(join(app.getAppPath(), 'node_modules'), join(userProjectDir, 'node_modules'))

  const git = spawnSync('git', ['init', '--initial-branch=main'], { cwd: userProjectDir, stdio: 'ignore' })
  if (git.error || git.status !== 0) throw new Error('无法初始化博客的本地 Git 仓库')
  return userProjectDir
}

function waitForServer(child) {
  return new Promise((resolvePromise, reject) => {
    let settled = false
    const finish = url => {
      if (settled) return
      settled = true
      resolvePromise(url)
    }
    const inspect = chunk => {
      const match = String(chunk).match(/Blog Studio: (http:\/\/127\.0\.0\.1:\d+)/)
      if (match) finish(match[1])
    }
    child.stdout.on('data', inspect)
    child.stderr.on('data', inspect)
    child.once('error', error => {
      if (!settled) reject(error)
    })
    child.once('exit', code => {
      if (!settled) reject(new Error(`本地后台启动失败（退出码 ${code ?? '未知'}）`))
    })
  })
}

async function startServer() {
  projectDir = await getProjectDir()
  serverProcess = spawn(process.execPath, [bundledServer], {
    cwd: projectDir,
    env: {
      ...process.env,
      ELECTRON_RUN_AS_NODE: '1',
      BLOG_PROJECT_DIR: projectDir,
      BLOG_ADMIN_CONFIG_DIR: app.getPath('userData'),
      BLOG_ADMIN_PORT: '0'
    },
    stdio: ['ignore', 'pipe', 'pipe']
  })
  serverProcess.stderr.on('data', chunk => console.error(String(chunk).trim()))
  return waitForServer(serverProcess)
}

function createMenu() {
  Menu.setApplicationMenu(Menu.buildFromTemplate([
    {
      label: '文件',
      submenu: [
        { label: '打开博客目录', click: () => shell.openPath(projectDir) },
        { type: 'separator' },
        { role: 'quit', label: '退出 Blog Studio' }
      ]
    },
    { role: 'editMenu' },
    { role: 'windowMenu' }
  ]))
}

async function createWindow() {
  const url = await startServer()
  if (!url) return app.quit()
  mainWindow = new BrowserWindow({
    width: 1440,
    height: 920,
    minWidth: 960,
    minHeight: 640,
    title: 'zzZ Blog Studio',
    backgroundColor: '#111318',
    webPreferences: {
      contextIsolation: true,
      sandbox: true
    }
  })
  mainWindow.on('closed', () => {
    mainWindow = null
    if (serverProcess && !serverProcess.killed) serverProcess.kill()
    serverProcess = null
  })
  await mainWindow.loadURL(url)
  createMenu()
}

app.whenReady().then(createWindow).catch(async error => {
  await dialog.showMessageBox({ type: 'error', title: 'Blog Studio 启动失败', message: error.message })
  app.quit()
})

app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('before-quit', () => {
  if (serverProcess && !serverProcess.killed) serverProcess.kill()
})
app.on('activate', () => { if (!mainWindow) createWindow() })
