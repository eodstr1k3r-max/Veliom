import {
  createComponent,
  createSignal,
  mount,
  h,
  Show,
  usePlugin,
  KeepAlive,
  Transition,
  useVirtualList,
  createRef,
  onMount,
} from '../src/veliom';

const LOG_PREFIX = '🔌 Plugin';
usePlugin({
  name: 'demo-logger',
  hooks: {
    mounted: (vnode) => { if (vnode.type === 'div') console.log(LOG_PREFIX, 'mounted', vnode.type); },
    beforeUnmount: (vnode) => { if (vnode.type === 'div') console.log(LOG_PREFIX, 'unmounting', vnode.type); },
  },
});

const TabA = createComponent(() => {
  const count = createSignal(0);
  return () => h('div', { style: 'padding:1rem;background:rgba(0,217,255,0.1);border-radius:8px;' },
    h('h3', null, 'Tab A — Counter'),
    h('p', null, String(count.get())),
    h('button', { onClick: () => count.update(n => n + 1) }, 'Increment'),
    h('p', { style: 'color:#888;font-size:0.85rem;margin-top:1rem;' },
      'Counter persists across tab switches (KeepAlive)')
  );
});

const TabB = createComponent(() => {
  const text = createSignal('');
  return () => h('div', { style: 'padding:1rem;background:rgba(0,255,136,0.1);border-radius:8px;' },
    h('h3', null, 'Tab B — Input'),
    h('input', {
      type: 'text',
      placeholder: 'Type something...',
      value: text.get(),
      onInput: (e: Event) => text.set((e.target as HTMLInputElement).value),
    }),
    h('p', null, `You typed: ${text.get()}`)
  );
});

const KeepAliveDemo = createComponent(() => {
  const tab = createSignal('a');
  return () => h('div', null,
    h('h3', null, 'KeepAlive Tabs'),
    h('div', { style: 'display:flex;gap:0.5rem;margin-bottom:1rem;' },
      h('button', {
        style: tab.get() === 'a' ? 'background:#00d9ff;color:#000;' : '',
        onClick: () => tab.set('a'),
      }, 'Tab A'),
      h('button', {
        style: tab.get() === 'b' ? 'background:#00d9ff;color:#000;' : '',
        onClick: () => tab.set('b'),
      }, 'Tab B'),
    ),
    Show({
      when: tab.get() === 'a',
      children: () => h(KeepAlive, { key: 'tab-a' }, h(TabA)),
      fallback: () => h(KeepAlive, { key: 'tab-b' }, h(TabB)),
    }),
  );
});

const TransitionDemo = createComponent(() => {
  const show = createSignal(true);
  return () => h('div', null,
    h('h3', null, 'Transition (fade)'),
    h('button', { onClick: () => show.update(v => !v) },
      show.get() ? 'Hide' : 'Show'),
    h(Transition, { show: show.get(), name: 'fade' },
      h('div', {
        style: 'margin-top:0.5rem;padding:1rem;background:rgba(255,255,255,0.05);border-radius:8px;'
      }, 'This content fades in/out'))
  );
});

const VirtualListDemo = createComponent(() => {
  const containerRef = createRef<HTMLDivElement>();
  const allItems = Array.from({ length: 10000 }, (_, i) => `Item ${i} — ${Math.random().toString(36).slice(2, 8)}`);
  const list = createSignal(allItems);

  const { visibleItems, totalHeight, scrollTo } = useVirtualList(
    list.get(),
    { itemHeight: 36, overscan: 5, containerRef }
  );

  return () => h('div', null,
    h('h3', null, 'Virtual List (10,000 items)'),
    h('div', { style: 'display:flex;gap:0.5rem;margin-bottom:0.5rem;' },
      h('button', { onClick: () => scrollTo(0) }, 'Top'),
      h('button', { onClick: () => scrollTo(180000) }, 'Near Bottom'),
    ),
    h('div', {
      ref: containerRef,
      style: 'height:300px;overflow-y:auto;border:1px solid rgba(255,255,255,0.1);border-radius:8px;'
    },
      h('div', { style: `height:${totalHeight()}px;position:relative;` },
        visibleItems().map(item =>
          h('div', {
            key: String(item.index),
            style: `position:absolute;top:${item.offsetY}px;height:36px;left:0;right:0;
                    padding:0 1rem;display:flex;align-items:center;
                    background:${item.index % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'};`
          }, `${item.index}: ${item.data}`)
        )
      )
    ),
    h('p', { style: 'color:#888;font-size:0.85rem;' },
      `Rendering ${visibleItems().length} of ${list.get().length} items`)
  );
});

const DevToolsDemo = createComponent(() => {
  const state = createSignal<any>(null);
  onMount(() => {
    const dt = (window as any).__VELIOM_DEVTOOLS__;
    if (dt) state.set(dt.getState());
  });
  return () => h('div', null,
    h('h3', null, 'DevTools Hook'),
    state.get()
      ? h('pre', { style: 'font-size:0.8rem;color:#00d9ff;background:rgba(0,0,0,0.3);padding:0.5rem;border-radius:4px;' },
          JSON.stringify(state.get(), null, 2))
      : h('p', { style: 'color:#888;' }, '__VELIOM_DEVTOOLS__ not available')
  );
});

const App = createComponent(() => {
  return () => h('div', { style: 'font-family:-apple-system,sans-serif;max-width:600px;margin:2rem auto;padding:2rem;color:#eaeaea;' },
    h('h1', { style: 'color:#00d9ff;' }, 'Veliom v0.2.1 Features'),
    h('p', { style: 'color:#888;margin-bottom:2rem;' },
      'Plugin System · KeepAlive · Transition · useVirtualList · DevTools'),

    h('section', { style: 'margin-bottom:2rem;' }, h(KeepAliveDemo)),
    h('section', { style: 'margin-bottom:2rem;' }, h(TransitionDemo)),
    h('section', { style: 'margin-bottom:2rem;' }, h(VirtualListDemo)),
    h('section', { style: 'margin-bottom:2rem;' }, h(DevToolsDemo)),
  );
});

const container = document.getElementById('app');
if (container) {
  mount(App, container);
}
