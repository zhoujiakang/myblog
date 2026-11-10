/* 手动重跑一次线上部署。
 *
 * 正式发布链路是 push content 触发 .github/workflows/deploy.yml：
 * build job 用 npm ci + vite build 生成 dist，deploy job 在 github-pages
 * 环境下把产物交给 deploy-pages action。文章内容在 content 分支上，
 * CI 自己检出，本地不上传任何文件。
 *
 * 这里只调 workflow_dispatch 触发同一条工作流，用于 Pages 环境配置
 * 修好之后补跑一次；需要本机装好并登录 gh。 */
import { execSync } from 'node:child_process'

const exec = (cmd) => execSync(cmd, { stdio: 'inherit' })
const read = (cmd) => execSync(cmd, { encoding: 'utf8' }).trim()

const branch = read('git branch --show-current')
if (branch !== 'content') {
  console.error(`当前在 ${branch} 分支，部署工作流只在 content 分支上定义。`)
  process.exit(1)
}

exec('gh workflow run "Deploy to GitHub Pages" --ref content')
console.log('\n已触发部署，用 gh run list --workflow=deploy.yml --limit 1 查看结果')
