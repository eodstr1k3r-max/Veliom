# Veliom 🚀

**Ultra-fast, minimal frontend framework with API-agnostic design**

[![npm version](https://img.shields.io/npm/v/veliom.svg)](https://www.npmjs.com/package/veliom)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Downloads](https://img.shields.io/npm/dm/veliom)](https://www.npmjs.com/package/veliom)

---

## Why Veliom?

<p align="center">
  <img src="https://img.shields.io/badge/⚡-High%20Performance-blue" alt="Performance">
  <img src="https://img.shields.io/badge/📦-~5KB-gold" alt="Size">
  <img src="https://img.shields.io/badge/🔷-TypeScript-green" alt="TypeScript">
  <img src="https://img.shields.io/badge/🔒-Security%20First-red" alt="Security">
</p>

- **Performance First** — Every feature justifies its cost
- **Minimal Core** — No bloat, just what you need
- **API-Agnostic** — Use fetch, axios, GraphQL — your choice
- **TypeScript Native** — Full type safety out of the box
- **ESM & CJS** — Dual package with working `import` and `require` out of the box (verified in the build pipeline)
- **Security-Aware** — Built-in XSS protection (11 security fixes)
- **Production Ready** — 349 tests, strict-mode clean, zero runtime dependencies

---

## ✨ What's New in v0.3.7

- **Fixed ESM & CJS builds** — extensionless imports broke `import` in native Node ESM; CJS files were treated as ESM under Node ≥ 22. Both are fixed and guarded by `npm run smoke` before every publish.
- **Security fix** — `formAction` no longer accepts `javascript:`/`data:`/`vbscript:` URLs (CWE-79).
- **Rendering fixes** — text nodes are now correctly removed on patch, removed `style` keys are cleaned up, stale event-delegation entries are cleared on re-render, and `unmount()` fully cleans up the VNode tree (`removeVNode`).
- **`useEffect` without deps** now runs after every render (with previous cleanup), matching React semantics.
- **Docs & examples** updated to the real API (direct component calls, correct signatures, new `lazy-demo` page).

---

## Quick Start

```bash
npm install veliom
```

```typescript
import { createComponent, createSignal, h } from 'veliom';

const Counter = createComponent(() => {
  const count = createSignal(0);

  return () => h('div', null,
    h('span', null, String(count.get())),
    h('button', { onClick: () => count.update(n => n + 1) }, '+')
  );
});

const App = createComponent(() => {
  return () => h('div', null, Counter({}));
});

// Mount to DOM
import { mount } from 'veliom';
mount(App, document.getElementById('app')!);
```

---

## Features

### ⚡ High-Performance Rendering
- Virtual DOM with efficient diffing & LIS-based keyed reconciliation (O(n log n) minimal DOM moves)
- RAF-batched DOM update queue (`scheduleDOMUpdate` / `flushDOMUpdates`)
- Event delegation — O(n) instead of O(n×m)
- Batched updates with `batch()`
- Style object support, `classList` (string/array/object)
- `dangerouslySetInnerHTML`, `ATTR_ALIAS` (htmlFor→for, className→class, etc.)

### 🔄 Reactive State Management
```typescript
const count = createSignal(0);
count.set(5);
count.update(n => n + 1);

const store = createStore({ user: null, loading: false });
store.set('loading', true);

// Computed (auto-tracking)
const fullName = createComputed(() => `${firstName.get()} ${lastName.get()}`);

// Memo (cached)
const doubled = createMemo(() => count.get() * 2);

// Deep reactive store
const deep = createDeepStore({ nested: { value: 1 } });
deep.state.nested.value; // tracks automatically
deep.subscribe(() => console.log('mutated'));

// Media query
const isLarge = createMediaQuery('(min-width: 768px)');

// Combine signals
const sum = combineSignals([a, b], () => a.get() + b.get());
```

### 🪝 Hooks (25+)
```typescript
const App = createComponent(() => {
  const [getCount, setCount] = useState(0);
  const [getItems, setItems] = useState<string[]>([]);
  const ref = useRef<HTMLDivElement>(null);
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => { document.title = `Count: ${getCount()}`; }, [getCount]);
  const doubled = useMemo(() => getCount() * 2, [getCount]);

  // Additional hooks
  const isOnline = useOnlineStatus();
  const scheme = usePreferredColorScheme(); // 'light' | 'dark'
  const size = useWindowSize();
  const scroll = useScrollPosition();
  const isIdle = useIdleTimer(30000);
  const isPressed = useKeyPress('Enter');

  return () => h('div', null, ...);
});
```

### 🧩 Component System
```typescript
const Button = createComponent((props) => {
  return () => h('button', { class: props.class }, props.children);
});

// Memo (shallow prop comparison)
const Expensive = memo((props) => {
  return () => h('div', null, props.data);
});
```

### 🎯 Control Flow
```typescript
// Conditional
Show({ when: isLoggedIn, children: () => h('div', null, 'Welcome!') });

// Switch/Match (SolidJS-like)
Switch({
  children: [
    Match({ when: status === 'loading', children: () => h('div', null, '...') }),
    Match({ when: status === 'error', children: () => h('div', null, 'Error!') }),
    Match({ when: true, children: () => h('div', null, 'Ready') }),
  ]
});

// Lists with optional key function
For({ each: items, key: (item) => String(item.id), children: (item) => h('li', null, item.name) });

// Index (index-based rendering)
Index({ each: items, children: (item, idx) => h('li', null, `${idx}: ${item}`) });
```

### 🌐 Router
```typescript
const router = createRouter([
  { path: '/', component: Home },
  { path: '/users/:id', component: UserProfile },
], { mode: 'hash' });

// Match a route / render a link (direct function calls)
Route({ path: '/', router, component: Home, fallback: NotFound });
Link({ to: '/users/1', router, children: h('span', null, 'User 1') });

// Access router state
const { path, params, navigate } = useRouter(router);
```

### 📦 Lazy Loading & Suspense
```typescript
const LazyComponent = lazy(() => import('./Heavy'));
Suspense({ children: LazyComponent, fallback: h('div', null, 'Loading...') });
```

### ⏳ Async & Resources
```typescript
// createAsync — general promise/sync-to-signal
const { data, loading, error, refetch } = createAsync(() => fetch('/api/data').then(r => r.json()));

// createResource — reactive data fetching (with optional source signal)
const users = createResource(() => fetch('/api/users').then(r => r.json()));
users.loading();   // boolean
users.refetch();   // re-run fetcher
users.mutate(newData); // set data locally
```

### Await Component
```typescript
Await({ promise: fetchUser(), loading: () => h('div', null, '...'), children: (user) => h('div', null, user.name) });
```

### ErrorBoundary
```typescript
ErrorBoundary({ fallback: () => h('div', null, 'Something went wrong'), children: () => MyComponent({}) });
```

### Portal / Teleport
```typescript
// Portal
createPortal({ children: h('div', null, 'Overlay'), target: document.getElementById('portal-root')! });

// Teleport
Teleport({ to: '#portal-root', children: h('div', null, 'Teleported content') });
```

### Dynamic Component
```typescript
Dynamic({ component: isDiv ? 'div' : MyComponent, class: 'dynamic' });
```

### 🧩 Plugin System
```typescript
import { usePlugin, Plugin } from 'veliom';

const logger: Plugin = {
  name: 'logger',
  hooks: {
    beforeCreate: (vnode) => console.log('creating', vnode.type),
    mounted: (vnode) => console.log('mounted', vnode.type),
    beforeUnmount: (vnode) => console.log('unmounting', vnode.type),
  },
};

usePlugin(logger);
```
Available hooks: `beforeCreate`, `created`, `beforeMount`, `mounted`, `beforeUpdate`, `updated`, `beforeUnmount`, `unmounted`.

### 🔁 KeepAlive
```typescript
import { KeepAlive, clearKeepAliveCache } from 'veliom';

// Caches DOM + VNode by key on first render
KeepAlive({ key: 'tab-1', children: TabContent({}) });

// Clear single or all cache entries
clearKeepAliveCache('tab-1');
clearKeepAliveCache(); // all
```

### 🎬 Transition (Enter/Leave)
```typescript
import { Transition, createTransitionClasses, leaveTransition } from 'veliom';

// CSS class-based enter (leave is manual via leaveTransition)
Transition({ show: isVisible, name: 'fade', children: h('div', null, 'Content') });

// Manual enter animation
createTransitionClasses(el, 'fade', () => console.log('enter done'));

// Manual leave animation
leaveTransition(el, 'fade', () => console.log('leave done'));
```
Enter animation applies: `{name}-enter-from` → `{name}-enter-active` → `{name}-enter-to`. Leave classes (`{name}-leave-from`, `{name}-leave-active`, `{name}-leave-to`) are applied by `leaveTransition()` — the component itself only animates the enter side.

### 🌐 Server-Side Rendering
```typescript
import { renderToString, renderToStringWithData, h } from 'veliom';

const html = renderToString(h('div', { class: 'app' }, 'Hello SSR'));
// '<div class="app">Hello SSR</div>'

const withData = renderToStringWithData(appVNode, { user: { id: 1 } });
// Appends script with window.__INITIAL_DATA__
```

### 🔧 DevTools Hook
```typescript
import { enableDevTools } from 'veliom';
enableDevTools(); // registers window.__VELIOM_DEVTOOLS__
const devtools = (window as any).__VELIOM_DEVTOOLS__;
console.log(devtools.getState());
// { components: [...], signals: [...] }
```

### Context
```typescript
const Theme = createContext('light');

// Provider (direct function call)
Theme.Provider({ value: 'dark', children: Child({}) });

// Consume
const theme = useContext(Theme);
```

### Children Utilities
```typescript
Children.toArray(children);          // Flattens nested fragments
Children.map(children, fn);          // Map + flatten
Children.forEach(children, fn);      // ForEach + flatten
Children.only(children);             // Throw if ≠ 1 child
Children.count(children);            // Total child count
```

### 🔒 Security
- Built-in XSS protection
- Sanitizes dangerous protocols (`javascript:`, `data:`, `vbscript:`)
- Blocks malicious attributes during create and patch
- State isolation between components

---

## Full Hook API

| Hook | Returns | Description |
|------|---------|-------------|
| `useState` | `[get, set]` | Reactive state |
| `useReducer` | `[state, dispatch]` | Reducer pattern |
| `useRef` | `{ current }` | Mutable ref |
| `useEffect` | — | Side effects with cleanup |
| `useMemo` | value | Memoized computation |
| `useCallback` | fn | Memoized callback |
| `useTransition` | `[isPending, startTransition]` | Non-urgent updates |
| `usePrevious` | prev value | Track previous value |
| `useDebouncedValue` | derived signal | Debounced reactive value |
| `useEventListener` | — | Auto-cleaned event listener |
| `useInterval` | — | Interval (pause with null) |
| `useTimeout` | — | Timeout (pause with null) |
| `useMediaQuery` | `() => boolean` | CSS media query |
| `useLocalStorage` | `[get, set]` | localStorage-backed signal |
| `useForm` | form object | Form state + validation |
| `useIntersectionObserver` | entry | Element visibility |
| `useResizeObserver` | rect | Element size tracking |
| `useClipboard` | `{ copy, copied }` | Clipboard API |
| `useDocumentTitle` | — | Dynamic page title |
| `useOnlineStatus` | `() => boolean` | Online/offline |
| `usePreferredColorScheme` | `'light' \| 'dark'` | Color scheme |
| `useGeolocation` | `{ coords, error, loading }` | Geolocation |
| `useWindowSize` | `{ width, height }` | Window dimensions |
| `useKeyPress` | `() => boolean` | Key press state |
| `useHover` | `() => boolean` | Element hover |
| `useScrollPosition` | `{ x, y }` | Scroll position |
| `useIdleTimer` | `() => boolean` | User idle detection |
| `useVirtualList` | `{ visibleItems, totalHeight, scrollTo }` | Virtual scrolling |

---

## Events

```typescript
// onClickOutside — detect clicks outside an element
onClickOutside(elementRef, () => console.log('clicked outside'));
onClickOutside(elementRef, handler, isOpen); // conditional (boolean)
```

---

## API-Agnostic Design

Veliom intentionally does NOT include HTTP clients or data fetching. You're free to use whatever you want:

```typescript
const DataComponent = createComponent(() => {
  const data = createSignal<Data[]>([]);
  const loading = createSignal(false);

  const fetchData = async () => {
    loading.set(true);
    const res = await fetch('/api/data');
    data.set(await res.json());
    loading.set(false);
  };

  return () => h('div', null, ...);
});
```

---

## Performance Benchmarks

| Feature | Impact |
|---------|--------|
| Event Delegation | O(n) instead of O(n×m) |
| LIS Keyed Reconciliation | Minimal DOM moves (O(n log n)) |
| RAF-Batched Updates | Single DOM write per frame |

---

## Project Structure

```
src/
├── core/
│   ├── renderer.ts      # Virtual DOM & rendering (h, render, patch, createElement, removeVNode)
│   ├── component.ts     # Component system (createComponent, mount, update, unmount, memo)
│   ├── control.ts       # Show, For, Index, Switch, Match, Fragment
│   ├── router.ts        # Hash/history router, Route, Link, useRouter
│   ├── error.ts         # ErrorBoundary, createErrorBoundary, global error handler
│   ├── await.ts         # Await component (promise rendering)
│   ├── dynamic.ts       # Dynamic component
│   ├── portal.ts        # createPortal rendering
│   ├── teleport.ts      # Teleport component
│   ├── lazy.ts          # lazy() + preload()
│   ├── suspense.ts      # Suspense, createSuspense
│   ├── refs.ts          # createRef, mergeRefs
│   ├── keepAlive.ts     # KeepAlive, clearKeepAliveCache
│   ├── plugin.ts        # Plugin system (8 lifecycle hooks)
│   ├── scheduler.ts     # RAF-batched DOM updates (scheduleDOMUpdate/flushDOMUpdates)
│   ├── ssr.ts           # renderToString, renderToStringWithData
│   └── transition.ts    # Transition, createTransitionClasses, leaveTransition
├── state/
│   ├── store.ts         # Signals, Store, DeepStore, Memo, Computed, batch
│   ├── hooks.ts         # 25+ hooks (useState, useEffect, useForm, etc.)
│   ├── async.ts         # createAsync, createFetcher
│   ├── context.ts       # createContext, useContext, provideContext
│   ├── resource.ts      # createResource data fetching
│   └── lifecycle.ts     # onMount, onUpdate, onUnmount
├── utils/
│   ├── children.ts      # Children.toArray, map, forEach, only, count
│   ├── events.ts        # onClickOutside
│   ├── lis.ts           # Longest increasing subsequence (keyed reconciliation)
│   ├── sanitize.ts      # HTML sanitization (dangerouslySetInnerHTML)
│   ├── devtools.ts      # enableDevTools/disableDevTools
│   └── benchmark.ts     # Performance tools
└── veliom.ts            # Main entry — re-exports all public API
```

---

## Installation

```bash
npm install veliom
```

## Development

```bash
npm install
npm run dev       # Start dev server
npm run test      # Run tests (349)
npm run typecheck # TypeScript check (strict mode)
npm run lint      # ESLint (0 warnings)
npm run build     # Build for production
npm run smoke     # Verify built ESM + CJS output loads under Node
```

---

## Browser Support

| Browser | Version |
|---------|---------|
| Chrome/Edge | 88+ |
| Firefox | 78+ |
| Safari | 14+ |

---

## License

MIT © 2026 DerStr1k3r

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

⭐ Star this repo if you find it useful!
