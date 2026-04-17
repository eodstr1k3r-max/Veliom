# Veliom

**Ultra-fast, minimal frontend framework with API-agnostic design**

[![CI](https://github.com/eodstr1k3r-max/Veliom/actions/workflows/ci.yml/badge.svg)](https://github.com/eodstr1k3r-max/Veliom/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/veliom.svg)](https://www.npmjs.com/package/veliom)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

---

## Why Veliom?

- **Performance First**: Every feature justifies its cost
- **Minimal Core**: No bloat, just what you need
- **API-Agnostic**: Use fetch, axios, GraphQL - your choice
- **TypeScript Native**: Full type safety out of the box
- **Lightweight**: ~5KB minified + gzip

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

## Core Features

### Rendering Engine
- Virtual DOM with efficient diffing
- Event delegation for performance
- Keyed reconciliation
- Fragment support

### State Management
```typescript
// Signals - reactive values
const count = createSignal(0);
count.set(5);
count.update(n => n + 1);

// Store - structured state
const store = createStore({ user: null, loading: false });
store.set('loading', true);

// Computed - derived values
const fullName = createComputed(
  () => `${firstName.get()} ${lastName.get()}`,
  [firstName, lastName]
);
```

### Component System
```typescript
const App = createComponent(() => {
  const [getCount, setCount] = useState(0);

  return () => h('div', null,
    h('h1', null, 'Hello Veliom!')
  );
});
```

### Control Flow
```typescript
// Conditional
Show({ when: isLoggedIn, children: () => h('div', null, 'Welcome!') });

// Lists
For({ each: items, children: (item) => h('li', { key: item.id }, item.name) });

// Fragments
Fragment({ children: [h('h1', null), h('p', null)] });
```

### Lazy Loading
```typescript
const LazyComponent = lazy(() => import('./Heavy'));

Suspense({
  children: LazyComponent,
  fallback: h('div', null, 'Loading...')
});
```

---

## API-Agnostic Design

Veliom intentionally does NOT include:
- HTTP clients
- API wrappers
- Data fetching abstractions

You are free to use:
- `fetch`
- `axios`
- GraphQL clients
- Any library you prefer

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

## Performance

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
│   ├── suspense.ts     # Suspense component
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

- Chrome/Edge 88+
- Firefox 78+
- Safari 14+

---

## License

MIT

---

## Contributing

Contributions welcome! See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.
