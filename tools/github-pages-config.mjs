import { writeFileSync } from 'node:fs'

const repository = process.env.GITHUB_REPOSITORY
if (!repository) {
  throw new Error('GITHUB_REPOSITORY is not set')
}

const [owner, repo] = repository.split('/')
const isUserSite = repo.toLowerCase() === `${owner}.github.io`.toLowerCase()
const root = isUserSite ? '/' : `/${repo}/`
const url = `https://${owner}.github.io${isUserSite ? '' : `/${repo}`}`

writeFileSync(
  '_config.pages.yml',
  `url: ${JSON.stringify(url)}\nroot: ${JSON.stringify(root)}\n`,
  'utf8'
)

console.log(`GitHub Pages URL: ${url}`)
