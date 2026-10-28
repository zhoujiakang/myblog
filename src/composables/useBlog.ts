import { computed, ref } from 'vue';
import source from 'virtual:blog-content';
import siteConfig from '../../config/site.json';
const site: Omit<typeof siteConfig, 'groups'> & {
  groups: { name: string; slug: string; description: string }[];
} = siteConfig;
export { site };
export const posts = ref(source);
export const groups = computed(() => {
  const names = [
    ...new Set([...site.groups.map((g) => g.name), ...posts.value.map((p) => p.group)]),
  ];
  return names
    .map((name) => {
      const config = site.groups.find((g) => g.name === name);
      const list = posts.value.filter((p) => p.group === name);
      return {
        name,
        slug: config?.slug || name,
        description: config?.description || '',
        count: list.length,
        latest: list[0]?.date || '',
        earliest: list.at(-1)?.date || '',
      };
    })
    .sort((a, b) => b.latest.localeCompare(a.latest));
});
export const tags = computed(() => {
  const counts = new Map<string, number>();
  posts.value.forEach((p) => p.tags.forEach((t) => counts.set(t, (counts.get(t) || 0) + 1)));
  return [...counts]
    .map(([name, count]) => ({
      name,
      count,
      tier: count >= 5 ? 1 : count >= 3 ? 2 : count >= 2 ? 3 : 4,
    }))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name, 'zh-CN'));
});
export const groupSlug = (name: string) => groups.value.find((g) => g.name === name)?.slug || name;

if (import.meta.hot)
  import.meta.hot.accept('virtual:blog-content', (module) => {
    if (module) posts.value = module.default;
  });
