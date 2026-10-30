/** 标记可横向滚动的表格容器：只有真的溢出时才加 data-scrollable，避免桌面端出现多余阴影。 */
let bound = false;

export function markScrollableTables(root: ParentNode = document): void {
  root.querySelectorAll<HTMLElement>('.table-wrap').forEach((el) => {
    el.toggleAttribute('data-scrollable', el.scrollWidth > el.clientWidth + 2);
  });
  if (bound || typeof window === 'undefined') return;
  bound = true;
  let timer = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(timer);
    timer = window.setTimeout(() => markScrollableTables(document), 200);
  });
}
