# Contributing to Veliom

Thank you for your interest in contributing to Veliom!

> **Warning:** Before contributing, please read the Code of Conduct.

## Getting Started

### Prerequisites

- Node.js 16+ 
- npm 8+

### Setup

```bash
# 1. Fork the repository
# 2. Clone your fork
git clone https://github.com/YOUR_USERNAME/Veliom.git
cd Veliom

# 3. Install dependencies
npm install

# 4. Start development
npm run dev
```

---

## Development Commands

| Command | Description |
|---------|-------------|
| `npm run dev` | Start dev server |
| `npm run build` | Production build |
| `npm run build:types` | Generate TypeScript declarations |
| `npm test` | Run tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with v8 coverage (thresholds enforced) |
| `npm run typecheck` | TypeScript type checking |
| `npm run lint` | Run ESLint (src, examples, tests) |
| `npm run size` | Bundle budget check (ESM JS ≤ 150 KB raw) |
| `npm run smoke` | Verify built ESM + CJS output loads under Node |

---

## Project Structure

```
src/
├── core/                    # Core rendering engine & built-in components
│   ├── renderer.ts          # Virtual DOM & rendering (h, render, patch, createElement)
│   ├── component.ts         # Component system (createComponent, mount, update, unmount, memo)
│   ├── control.ts           # Control flow (Show, For, Index, Switch, Match, Fragment)
│   ├── await.ts             # Promise-based rendering (Await)
│   ├── dynamic.ts           # Dynamic component rendering
│   ├── error.ts             # Error boundaries & global error handling
│   ├── keepAlive.ts         # Component instance caching (KeepAlive)
│   ├── lazy.ts              # Lazy-loaded components (lazy, preload)
│   ├── plugin.ts            # Plugin system (8 lifecycle hooks)
│   ├── portal.ts            # Portal rendering (createPortal, setPortalContainer)
│   ├── refs.ts              # Ref system (createRef, mergeRefs)
│   ├── router.ts            # Client-side router (hash/history, Route, Link)
│   ├── scheduler.ts         # RAF-batched DOM updates
│   ├── ssr.ts               # Server-side rendering (renderToString)
│   ├── suspense.ts          # Suspense for lazy components
│   ├── teleport.ts          # Teleport component
│   └── transition.ts        # CSS transition animations
├── state/                   # Reactive state management
│   ├── store.ts             # Signals, Store, createDeepStore, createComputed, createMemo, batch
│   ├── hooks.ts             # All hooks (useState, useEffect, useRef, etc. + createEffect)
│   ├── async.ts             # createAsync – general promise/sync-to-signal primitive
│   ├── context.ts           # createContext, useContext, provideContext
│   ├── lifecycle.ts         # onMount, onUpdate, onUnmount lifecycle hooks
│   └── resource.ts          # createResource – reactive data fetching
├── utils/                   # Utilities
│   ├── benchmark.ts         # Performance benchmarking tools
│   ├── children.ts          # Children utilities (toArray, map, forEach, only, count)
│   ├── devtools.ts          # DevTools integration (enableDevTools/disableDevTools)
│   ├── events.ts            # onClickOutside
│   ├── lis.ts               # Longest Increasing Subsequence (keyed DOM reconciliation)
│   └── sanitize.ts          # HTML sanitization (script tags, event handlers, dangerous URLs, embeds)
├── veliom.ts               # Barrel exports
```

---

## Code Style

### TypeScript

```typescript
// ✅ Good
function createComponent<T extends ComponentProps>(
  render: ComponentRender<T>
): Component {
  // ...
}

// ❌ Avoid
function createComponent(render) {
  // ...
}
```

### Naming Conventions

- **Components**: PascalCase (`CounterButton`)
- **Functions**: camelCase (`createSignal`)
- **Constants**: SCREAMING_SNAKE_CASE (`MAX_RETRIES`)
- **Files**: kebab-case (`component-props.ts`)

### Best Practices

1. Keep functions small and focused
2. Use TypeScript for all new code
3. Write tests before implementing
4. Document public APIs with JSDoc
5. Follow existing patterns

---

## Testing

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npx vitest run tests/store.test.ts
```

### Writing Tests

```typescript
import { describe, it, expect } from 'vitest';

describe('createSignal', () => {
  it('should create a signal with initial value', () => {
    const signal = createSignal(0);
    expect(signal.get()).toBe(0);
  });

  it('should update value', () => {
    const signal = createSignal(0);
    signal.set(5);
    expect(signal.get()).toBe(5);
  });
});
```

### Test Coverage

We enforce coverage thresholds (v8 provider, `src/**/*.ts`): 85% lines/statements, 78% branches, 74% functions — see `vitest.config.ts`. Run coverage with:

```bash
npm run test:coverage
```

---

## Pull Request Process

### Before Submitting

1. **Run tests**: `npm test`
2. **Type check**: `npm run typecheck`
3. **Lint**: `npm run lint`
4. **Build**: `npm run build`
5. **Smoke**: `npm run smoke`
6. **Update CHANGELOG.md** (if needed)

### PR Guidelines

- [ ] Tests pass
- [ ] TypeScript compiles without errors
- [ ] New features have tests
- [ ] Documentation updated (if needed)
- [ ] CHANGELOG entry added (for user-facing changes)

### Commit Messages

Follow Conventional Commits:

```
feat: add new feature
fix: resolve a bug
docs: update documentation
refactor: code refactoring
test: add tests
chore: maintenance
```

Example:
```
feat(store): add createComputed function
fix(hooks): fix useState initial value rendering
```

---

## Ideas for Contributions

- 📊 More test coverage
- ⚡ Performance optimizations  
- 📝 Additional documentation
- 🎨 More examples
- 🐛 Bug fixes
- 🌐 Internationalization
- 🎯 SSR support

---

## Questions?

- Open an [Issue](https://github.com/eodstr1k3r-max/Veliom/issues)
- Discussions: https://github.com/eodstr1k3r-max/Veliom/discussions

---

## License

By contributing, you agree to the MIT License.