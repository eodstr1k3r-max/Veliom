import {
  createComponent,
  createSignal,
  lazy,
  preload,
  mount,
  h,
  Suspense,
  Fragment,
} from '../src/veliom';

const HeavyComponent = createComponent(() => {
  return () =>
    h('div', { className: 'heavy-component' },
      h('h2', null, 'Heavy Component Loaded!'),
      h('p', null, 'This component was loaded dynamically.')
    );
});

const LazyLoadedComponent = lazy(
  () => import('./heavy-component').then(m => ({ default: HeavyComponent })),
  {
    fallback: h('div', { className: 'loading' },
      h('div', { className: 'spinner' }),
      h('p', null, 'Loading component...')
    )
  }
);

const App = createComponent(() => {
  const showLazy = createSignal(false);

  return () =>
    h('div', { className: 'lazy-demo' },
      h('h1', null, 'Lazy Loading Demo'),
      h('p', null, 'Components are loaded on-demand using dynamic imports'),

      h('div', { className: 'controls' },
        h('button', {
          onClick: () => {
            showLazy.update(v => !v);
            if (!showLazy.get()) {
              preload(LazyLoadedComponent);
            }
          }
        }, showLazy.get() ? 'Hide Component' : 'Show Lazy Component'),
        
        h('button', {
          onClick: () => preload(LazyLoadedComponent),
          disabled: LazyLoadedComponent.loaded
        }, LazyLoadedComponent.loaded ? 'Preloaded' : 'Preload')
      ),

      Suspense({
        children: LazyLoadedComponent as any,
        fallback: h('div', { className: 'suspense-fallback' },
          h('p', null, 'Click "Show Lazy Component" to load it')
        )
      }),

      Fragment({
        children: [
          h('hr', null),
          h('div', { className: 'status' },
            h('p', null, `Status: ${LazyLoadedComponent.loaded ? 'Loaded' : 'Not Loaded'}`),
            LazyLoadedComponent.error && h('p', { className: 'error' }, `Error: ${LazyLoadedComponent.error.message}`)
          )
        ]
      })
    );
});

const container = document.getElementById('app');
if (container) {
  mount(App, container);
}
