import { createRouter, createWebHashHistory, type RouteRecordRaw } from 'vue-router';
import HomeView from '../views/HomeView.vue';
import ArticlesView from '../views/ArticlesView.vue';
import TaxonomyView from '../views/TaxonomyView.vue';
import PostView from '../views/PostView.vue';
import AboutView from '../views/AboutView.vue';
import NotFoundView from '../views/NotFoundView.vue';
const routes: RouteRecordRaw[] = [
  { path: '/', component: HomeView, meta: { title: '首页' } },
  { path: '/articles', component: ArticlesView, meta: { title: '全部文章' } },
  { path: '/categories', component: TaxonomyView, meta: { title: '全部分类' } },
  { path: '/tags', component: TaxonomyView, meta: { title: '全部标签' } },
  { path: '/posts/:slug', component: PostView, meta: { title: '文章' } },
  { path: '/about', component: AboutView, meta: { title: '关于' } },
];
// The compile-time constant removes the route AND editor chunk from public builds.
if (__LOCAL_EDITOR__)
  routes.push({
    path: '/write',
    component: () => import('../views/EditorView.vue'),
    meta: { title: '本地写作' },
  });
routes.push({ path: '/:pathMatch(.*)*', component: NotFoundView, meta: { title: '页面不存在' } });
const positions = new Map<string, number>();
export default createRouter({
  history: createWebHashHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior(to, from, saved) {
    positions.set(from.fullPath, window.scrollY);
    if (saved) return saved;
    if (to.path === '/articles' && from.path === '/articles') return false;
    return { top: positions.get(to.fullPath) || 0 };
  },
});
