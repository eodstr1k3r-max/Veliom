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
- **Security-Aware** — Built-in XSS protection
- **Production Ready** — 280+ tests, strict-mode clean

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
  return () => h('div', null, h(Counter));
});

// Mount to DOM
import { render } from 'veliom';
render(h(App), document.getElementById('app')!);
```

---

## Features

### ⚡ High-Performance Rendering
- Virtual DOM with efficient diffing & keyed reconciliation
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
deep.nested.value; // tracks automatically
deep.subscribe((newVal) => console.log(newVal));

// Media query
const isLarge = createMediaQuery('(min-width: 768px)');

// Combine signals
const sum = combineSignals([a, b], () => a.get() + b.get());
```

### 🪝 Hooks (21+)
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

// Lists with optional keys
For({ each: items, key: 'id', children: (item) => h('li', null, item.name) });

// Index (index-based rendering)
Index({ each: items, children: (item, idx) => h('li', null, `${idx}: ${item}`) });
```

### 🌐 Router
```typescript
const router = createRouter([
  { path: '/', component: Home },
  { path: '/users/:id', component: UserProfile },
], { mode: 'hash' });

// In JSX:
h(Route, { path: '/', router, component: Home, fallback: NotFound });
h(Link, { to: '/users/1', router }, h('span', null, 'User 1'));

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

// createResource — reactive data fetching
const [resource, { mutate, refetch }] = createResource((id) => fetch(`/api/users/${id}`).then(r => r.json()), { initial: null });
```

### Await Component
```typescript
Await({ promise: fetchUser(), loading: () => h('div', null, '...'), children: (user) => h('div', null, user.name) });
```

### ErrorBoundary
```typescript
ErrorBoundary({ fallback: () => h('div', null, 'Something went wrong'), children: () => h(MyComponent) });
```

### Portal / Teleport
```typescript
// Portal
createPortal(h('div', null, 'Overlay'), document.getElementById('portal-root')!);

// Teleport JSX
h(Teleport, { to: '#portal-root' }, h('div', null, 'Teleported content'));
```

### Dynamic Component
```typescript
Dynamic({ component: isDiv ? 'div' : MyComponent, props: { class: 'dynamic' } });
```

### Context
```typescript
const Theme = createContext('light');

// JSX Provider
h(Theme.Provider, { value: 'dark' }, h(Child));

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

---

## Events

```typescript
// onClickOutside — detect clicks outside an element
onClickOutside(elementRef, () => console.log('clicked outside'));
onClickOutside(elementRef, handler, { enabled: isOpen }); // conditional
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
| Keyed Reconciliation | Minimal DOM operations |
| Batched Updates | Single re-render per batch |
| VNode Pooling | Reduced GC pressure |

---

## Project Structure

```
src/
├── core/
│   ├── renderer.ts      # Virtual DOM & rendering
│   ├── component.ts     # Component system (mount/update/unmount, memo)
│   ├── control.ts       # Show, For, Index, Switch, Match, Fragment
│   ├── router.ts        # Hash/history router, Route, Link
│   ├── error.ts         # ErrorBoundary, global error handler
│   ├── await.ts         # Await component (promise rendering)
│   ├── dynamic.ts       # Dynamic component
│   ├── portal.ts        # Portal rendering
│   ├── teleport.ts      # Teleport JSX component
│   ├── lazy.ts          # Lazy loading
│   ├── suspense.ts      # Suspense component
│   └── refs.ts          # Ref system
├── state/
│   ├── store.ts         # Signals, Store, DeepStore, Memo, Computed, batch
│   ├── hooks.ts         # 25+ hooks (useState, useEffect, useForm, etc.)
│   ├── async.ts         # createAsync primitive
│   ├── context.ts       # createContext, useContext, provideContext
│   ├── resource.ts      # createResource data fetching
│   └── lifecycle.ts     # onMount, onUpdate, onUnmount
├── utils/
│   ├── children.ts      # Children.toArray, map, forEach, only, count
│   ├── events.ts        # onClickOutside
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
npm run test      # Run tests (280+)
npm run typecheck # TypeScript check (strict mode)
npm run lint      # ESLint (0 warnings)
npm run build     # Build for production
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
