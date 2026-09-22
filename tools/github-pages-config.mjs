import { existsSync, readFileSync, writeFileSync } from 'node:fs'

const repository = process.env.GITHUB_REPOSITORY
if (!repository) {
  throw new Error('GITHUB_REPOSITORY is not set')
}

const [owner, repo] = repository.split('/')
const isUserSite = repo.toLowerCase() === `${owner}.github.io`.toLowerCase()
const cnamePath = 'source/CNAME'
const customDomain = existsSync(cnamePath) ? readFileSync(cnamePath, 'utf8').trim() : ''
const root = customDomain || isUserSite ? '/' : `/${repo}/`
const url = customDomain
  ? `https://${customDomain}`
  : `https://${owner}.github.io${isUserSite ? '' : `/${repo}`}`

writeFileSync(
  '_config.pages.yml',
  `url: ${JSON.stringify(url)}\nroot: ${JSON.stringify(root)}\n`,
  'utf8'
)

console.log(`GitHub Pages URL: ${url}`)
