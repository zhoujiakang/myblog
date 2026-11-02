import { createRouter, createWebHashHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import WorksView from '../views/WorksView.vue'
import SkillsView from '../views/SkillsView.vue'
import ArticlesView from '../views/ArticlesView.vue'
import AboutView from '../views/AboutView.vue'
import WorkDetail from '../views/WorkDetail.vue'
import SkillDetail from '../views/SkillDetail.vue'
import ArticleDetail from '../views/ArticleDetail.vue'
import NotFound from '../components/NotFound.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/works', name: 'works', component: WorksView },
  { path: '/works/:slug', name: 'work', component: WorkDetail },
  { path: '/skills', name: 'skills', component: SkillsView },
  { path: '/skills/:slug', name: 'skill', component: SkillDetail },
  { path: '/articles', name: 'articles', component: ArticlesView },
  { path: '/articles/:slug', name: 'article', component: ArticleDetail },
  { path: '/about', name: 'about', component: AboutView },
  // 全局兜底：任意未匹配路径都走 404，避免白屏
  { path: '/:pathMatch(.*)*', name: 'not-found', component: NotFound },
]

// GitHub Pages 没有服务端重写能力，所以用 hash 模式：
// 任意路由直接刷新 / 分享链接都不会 404。
// 若以后部署到支持 history fallback 的环境，可改成 createWebHistory()。
export default createRouter({
  history: createWebHashHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})
