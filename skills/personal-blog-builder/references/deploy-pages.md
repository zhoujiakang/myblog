# 部署到 GitHub Pages（含自定义域名）

## 0. 前置检查

```bash
git branch --show-current        # 必须是 main（deploy.yml 只监听 main）
git rev-parse --show-toplevel    # 必须是本项目根，不是上级大仓库
ls .github/workflows/deploy.yml  # 必须在
```

## 1. 站点地址写真实域名

`content/site.md`：

```yaml
siteUrl: https://你的域名            # 根域部署
siteUrl: https://blog.你的域名       # 子域部署（写全！）
```

漏了这步 `og:image` 会是相对地址或错误域名，分享卡片没图。

## 2. 自定义域要落 CNAME 文件

```bash
printf 'blog.你的域名\n' > public/CNAME   # 不带 https://、不带尾斜杠
```

构建后 `dist/CNAME` 由 GitHub Pages 读取，保证每次部署域名不丢。

## 3. 仓库与分支

```bash
# 新仓库
gh repo create <name> --public --source=. --remote=origin --push

# 或接入已有仓库（谨慎：会覆盖）
git remote add origin https://github.com/<user>/<repo>.git
git fetch origin
git push origin origin/main:refs/heads/backup-before-overwrite-$(date +%Y%m%d)
git push --force-with-lease origin main
git branch --set-upstream-to=origin/main main
```

Pages 免费需要**公开仓库**（私有仓库需付费计划）。

## 4. 开启 Pages（源必须是 GitHub Actions）

```bash
gh api -X POST repos/<user>/<repo>/pages -f build_type=workflow
```

已存在则用 PUT 改：

```bash
gh api -X PUT repos/<user>/<repo>/pages -f build_type=workflow
```

## 5. 绑定自定义域 + 强制 HTTPS

```bash
gh api -X PUT repos/<user>/<repo>/pages -f cname=blog.你的域名
gh api -X PUT repos/<user>/<repo>/pages -F https_enforced=true
```

DNS 侧（在域名服务商）：

| 场景 | 记录 |
| --- | --- |
| 子域 `blog.example.com` | `CNAME` → `<user>.github.io` |
| 根域 `example.com` | `A` → `185.199.108.153` / `.109.153` / `.110.153` / `.111.153`（四条） |

等 `dig +short blog.你的域名` 能返回 `github.io` 再继续。证书签发通常 5–20 分钟，`https_certificate.state` 变 `approved` 即完成。

## 6. 部署并验证

```bash
git push origin main
gh run list --repo <user>/<repo> --limit 3      # 看 in_progress → completed
gh run watch <run-id> --repo <user>/<repo> --exit-status
```

验证线上内容（**必须做**，只看 workflow 绿不够）：

```bash
curl -sL https://blog.你的域名/ | grep -oE '<title>[^<]*</title>|assets/index-[A-Za-z0-9_-]+\.js'
curl -sIL https://blog.你的域名/og-cover.png | head -3
```

比对 `assets/index-<hash>.js` 与本地 `dist/assets/` 里的哈希：一致才说明线上真是这次构建。

## 7. 日常发布

```bash
git add -A && git commit -m "feat: 新增一篇文章" && git push
```

推送即触发构建，约 1–2 分钟上线。**不要手动往仓库塞 `dist/`。**

## 8. 排错对照

| 现象 | 检查 |
| --- | --- |
| 推了代码无 workflow 运行 | 分支名是否 `main`；`.github/workflows/deploy.yml` 是否在根 |
| workflow 绿但线上是旧内容 | CDN 缓存（加 `?v=时间戳` 重试）；run 是否对应最新 commit |
| 页面全白、资源 404 | `base` 必须是 `'./'`；Pages `build_type` 必须是 `workflow` |
| 自定义域失效回 github.io | `public/CNAME` 是否缺失或含协议/尾斜杠 |
| 刷新子页面 404 | 路由必须 `createWebHashHistory()` |
| 证书一直 pending | DNS 未生效；先 `dig` 确认，再等 24h |
| `protected_domain_state: unverified` | 不影响访问。要消除：DNS 加 `_github-pages-challenge-<user>` TXT 记录（值见 Settings → Pages） |

## 9. 回滚

```bash
# 回到上一个提交
git revert <bad-commit> && git push

# 恢复被覆盖的旧站（如果事前建了备份分支）
git push --force origin backup-before-overwrite-YYYYMMDD:main
```
