import { nextTick } from 'vue';

type MermaidModule = typeof import('mermaid');
type Mermaid = MermaidModule['default'];

let loader: Promise<MermaidModule> | null = null;
let seq = 0;
let observer: MutationObserver | null = null;

const readVar = (name: string, fallback = '') => {
  const value = getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  return value || fallback;
};

function themeVariables() {
  return {
    background: readVar('--surface', '#ffffff'),
    primaryColor: readVar('--accent-soft', '#eef2f8'),
    primaryTextColor: readVar('--text', '#1b212b'),
    primaryBorderColor: readVar('--accent', '#2f6fed'),
    secondaryColor: readVar('--surface-2', '#f4f6f8'),
    secondaryTextColor: readVar('--text', '#1b212b'),
    secondaryBorderColor: readVar('--border-strong', '#d4d9e0'),
    tertiaryColor: readVar('--surface-2', '#f4f6f8'),
    tertiaryTextColor: readVar('--text-2', '#5a6472'),
    lineColor: readVar('--text-3', '#8a929e'),
    textColor: readVar('--text', '#1b212b'),
    mainBkg: readVar('--accent-soft', '#eef2f8'),
    nodeBorder: readVar('--accent', '#2f6fed'),
    clusterBkg: readVar('--surface-2', '#f4f6f8'),
    clusterBorder: readVar('--border', '#e5e8ec'),
    edgeLabelBackground: readVar('--surface', '#ffffff'),
    titleColor: readVar('--text', '#1b212b'),
    fontFamily: readVar('--font-sans', 'sans-serif'),
    fontSize: '12px',
    actorBkg: readVar('--surface', '#ffffff'),
    actorBorder: readVar('--accent', '#2f6fed'),
    actorTextColor: readVar('--text', '#1b212b'),
    actorLineColor: readVar('--border-strong', '#d4d9e0'),
    signalColor: readVar('--text-2', '#5a6472'),
    signalTextColor: readVar('--text-2', '#5a6472'),
    labelBoxBkgColor: readVar('--accent-soft', '#eef2f8'),
    labelBoxBorderColor: readVar('--accent', '#2f6fed'),
    labelTextColor: readVar('--text', '#1b212b'),
    loopTextColor: readVar('--text-2', '#5a6472'),
    noteBkgColor: readVar('--surface-2', '#f4f6f8'),
    noteTextColor: readVar('--text-2', '#5a6472'),
    noteBorderColor: readVar('--border-strong', '#d4d9e0'),
    activationBkgColor: readVar('--accent-soft', '#eef2f8'),
    activationBorderColor: readVar('--accent', '#2f6fed'),
    sequenceNumberColor: readVar('--surface', '#ffffff'),
  };
}

function themeCss() {
  const text2 = readVar('--text-2', '#5a6472');
  const accent = readVar('--accent', '#2f6fed');
  return `
    .actor { rx: 6px; ry: 6px; stroke-width: 1px; }
    text.actor > tspan { font-weight: 500; }
    .messageText { fill: ${text2}; }
    .note { rx: 4px; ry: 4px; }
    .labelBox { rx: 4px; ry: 4px; stroke-width: 1px; }
    .loopLine { stroke: ${accent}; stroke-width: 1px; }
    #sequenceNumber { font-weight: 600; }
    .node rect, .node polygon, .node circle, .node ellipse { stroke-width: 1px; }
    .node rect { rx: 6px; ry: 6px; }
    .edgeLabel { font-size: 12px; }
  `;
}

async function loadMermaid(): Promise<Mermaid> {
  if (!loader) loader = import('mermaid');
  const mod = await loader;
  return mod.default;
}

/** 把 .mermaid 容器里的源码渲染成 SVG；源代码存在 data-source 上，切换主题后可重渲染。 */
export async function renderMermaid(root: ParentNode = document): Promise<void> {
  const nodes = [...root.querySelectorAll<HTMLElement>('.mermaid')];
  if (!nodes.length) return;

  const mermaid = await loadMermaid();
  mermaid.initialize({
    startOnLoad: false,
    securityLevel: 'strict',
    theme: 'base',
    themeVariables: themeVariables(),
    themeCSS: themeCss(),
    fontFamily: readVar('--font-sans', 'sans-serif'),
    sequence: {
      useMaxWidth: true,
      mirrorActors: false,
      actorMargin: 32,
      messageMargin: 26,
      boxMargin: 6,
      noteMargin: 6,
      bottomMarginAdj: 4,
    },
  });

  for (const node of nodes) {
    if (!node.dataset.source) node.dataset.source = node.textContent ?? '';
    try {
      const { svg } = await mermaid.render(`mermaid-svg-${++seq}`, node.dataset.source);
      node.innerHTML = svg;
      node.dataset.rendered = '1';
    } catch (error) {
      node.dataset.error = '1';
      console.warn('[mermaid] 渲染失败', error);
    }
  }
}

/** 主题切换时用同一份源码重渲染，图表颜色跟着 token 走。 */
export function watchMermaidTheme(): void {
  if (observer || typeof MutationObserver === 'undefined') return;
  observer = new MutationObserver(() => {
    void renderMermaid(document);
  });
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

/** 页面内容更新后调用：等 DOM 更新完再渲染。 */
export async function refreshMermaid(root?: ParentNode): Promise<void> {
  await nextTick();
  watchMermaidTheme();
  await renderMermaid(root ?? document);
}
