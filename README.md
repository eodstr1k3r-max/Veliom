# Veliom 🚀

**Ultra-fast, minimal frontend framework with API-agnostic design**

[![CI](https://github.com/eodstr1k3r-max/Veliom/actions/workflows/ci.yml/badge.svg)](https://github.com/eodstr1k3r-max/Veliom/actions/workflows/ci.yml)
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

- **Performance First** - Every feature justifies its cost
- **Minimal Core** - No bloat, just what you need
- **API-Agnostic** - Use fetch, axios, GraphQL - your choice
- **TypeScript Native** - Full type safety out of the box
- **Security-Aware** - Built-in XSS protection
- **Production Ready** - Tested and battle-hardened

---

## Quick Start

```bash
npm install veliom
```

```typescript
import { createComponent, createSignal, mount, h } from 'veliom';

const Counter = createComponent(() => {
  const count = createSignal(0);

  return () => h('div', null,
    h('span', null, String(count.get())),
    h('button', { onClick: () => count.update(n => n + 1) }, '+')
  );
});

mount(Counter, document.getElementById('app')!);
```

---

## Features at a Glance

### ⚡ High-Performance Rendering
- Virtual DOM with efficient diffing
- Event delegation (O(n) vs O(n×m))
- Keyed reconciliation
- VNode pooling for reduced GC pressure
- Batched updates

### 🔄 Reactive State Management
```typescript
// Signals
const count = createSignal(0);
count.set(5);
count.update(n => n + 1);

// Store
const store = createStore({ user: null, loading: false });
store.set('loading', true);

// Computed
const fullName = createComputed(
  () => `${firstName.get()} ${lastName.get()}`,
  [firstName, lastName]
);
```

### 🪝 React-like Hooks
```typescript
const App = createComponent(() => {
  const [getCount, setCount] = useState(0);

  useEffect(() => {
    document.title = `Count: ${getCount()}`;
  }, [getCount]);

  const doubled = useMemo(() => getCount() * 2, [getCount]);

  return () => h('div', null, ...);
});
```

### 🧩 Component System
```typescript
const Button = createComponent((props) => {
  return () => h('button', { class: props.class }, props.children);
});
```

### 🎯 Control Flow
```typescript
// Conditional
Show({ when: isLoggedIn, children: () => h('div', null, 'Welcome!') });

// Lists with keys
For({ each: items, children: (item) => h('li', { key: item.id }, item.name) });

// Fragments
Fragment({ children: [h('h1', null), h('p', null)] });
```

### 📦 Lazy Loading
```typescript
const LazyComponent = lazy(() => import('./Heavy'));

Suspense({
  children: LazyComponent,
  fallback: h('div', null, 'Loading...')
});
```

### 🔒 Security
- Built-in XSS protection
- Sanitizes dangerous protocols (`javascript:`, `data:`, etc.)
- State isolation between components

---

## API-Agnostic Design

Veliom intentionally does NOT include HTTP clients or data fetching. You're free to use whatever you want:

```typescript
// fetch, axios, GraphQL - your choice!
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
| Batched Updates | Single re-render per frame |
| VNode Pooling | Reduced GC pressure |

---

## Project Structure

```
src/
├── core/
│   ├── renderer.ts    # Virtual DOM & rendering
│   ├── component.ts   # Component system
│   ├── control.ts     # Show, For, Fragment
│   ├── lazy.ts        # Lazy loading
│   ├── suspense.ts    # Suspense component
│   ├── portal.ts      # Portal rendering
│   ├── refs.ts        # Ref system
│   └── error.ts       # Error handling
├── state/
│   ├── store.ts       # Signals & Store
│   ├── hooks.ts       # useEffect, useState
│   └── lifecycle.ts    # Lifecycle hooks
└── utils/
    └── benchmark.ts   # Performance tools
```

---

## Installation

```bash
npm install veliom
```

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build

# Type check
npm run typecheck
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
