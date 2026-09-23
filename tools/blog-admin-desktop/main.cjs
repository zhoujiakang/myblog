const { app, BrowserWindow, dialog, Menu, shell } = require('electron')
const { spawn } = require('node:child_process')
const { existsSync } = require('node:fs')
const { join, resolve } = require('node:path')

const isDev = !app.isPackaged
const bundledServer = join(app.getAppPath(), 'tools/blog-admin/server.mjs')
// This is a personal, single-blog app rather than a multi-project editor.
const fixedProjectDir = resolve('/Users/zzz/code/myblog/blog')
let projectDir
let serverProcess
let mainWindow

function looksLikeBlog(dir) {
  return existsSync(join(dir, 'package.json')) && existsSync(join(dir, 'source'))
}

function getProjectDir() {
  if (!looksLikeBlog(fixedProjectDir)) {
    throw new Error(`绑定的博客目录不可用：${fixedProjectDir}`)
  }
  return fixedProjectDir
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
  projectDir = getProjectDir()
  const serverPath = isDev ? join(projectDir, 'tools/blog-admin/server.mjs') : bundledServer
  serverProcess = spawn(process.execPath, [serverPath], {
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
