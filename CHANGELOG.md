# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.2.5] - 2026-06-24

### Fixed
- `dangerouslySetInnerHTML` in SSR — produces valid HTML instead of malformed output
- Plugin hook exceptions — `try/catch` per hook prevents one plugin from breaking the chain
- Transition `transitionend` memory leak — `setTimeout` fallback + `transitioncancel` listener
- KeepAlive empty-string key — `key !== undefined` check instead of truthy check
- KeepAlive no longer returns opaque `{ type: 'keepAlive' }` VNode; returns the cached VNode directly
- devtools `getState()` — returns a shallow copy instead of mutable internal reference
- Scheduler `flushDOMUpdates` — cancels pending rAF before draining queue
- `resource.ts` — `disposed` guard prevents signal updates after `dispose()` (+ already-disposed check)
- `async.ts` — `disposed` guard + `dispose()` method on `AsyncState`
- `component.ts` — `update()` no longer re-runs child effects via `runEffects` (was duplicating `renderEffects`)
- `runEffects` in hooks.ts — dep-gated: skips effect if deps unchanged since last run
- `renderEffect` in component.ts — signals are properly stored in `effectRef` for component re-rendering
- `KeepAlive` internal `_key` property mismatch — reconcile `key !== _key` instead of checked-only
- `plugin.ts` `getPlugins()` exported but missing from `veliom.ts` barrel
- `longestIncreasingSubsequence` exported from `.d.ts` but missing from `veliom.ts` barrel
- `veliom.d.ts` `createSuspense` type was wrong (declared `{pending,resolve}` but returns `{Suspense,preload}`)
- `veliom.d.ts` `AsyncState` interface missing `dispose()`
- `resource.ts` — `loading` initialized to `true` (was `false`, showed stale "loaded" state before first fetch)
- `resource.ts` — added `dispose()` method to `Resource<T>` interface
- `async.ts` — stale promise guard (`pendingPromise` check, like resource.ts)
- `lazy.ts` — sync-throw guard via `try/catch` around `loader()`; re-throw `errorObj` instead of raw `err`
- `await.ts` — added reactive signal so parent re-renders when promise resolves/rejects
- `control.ts` `For`/`Index` — guard `null`/`undefined` `each` array; skip `null` children; clone VNode before mutating `key` (was corrupting cached VNodes)
- `renderer.ts` — `patchVNode` now clears `style.cssText` and `innerHTML` when those props are removed
- `router.ts` `matchRoute` — strip trailing slashes from pattern/path for consistent matching
- `router.ts` `createRouter` — escape special regex chars in `base` string
- `router.ts` `Route` — removed unused `createMemo` leak
- `router.ts` `navigate` — hash mode now calls `updatePath()` synchronously
- `store.ts` `createComputed` — initial compute now uses `runner()` (establishes tracking context correctly)
- `store.ts` `createDeepStore` — added `WeakMap` proxy cache; nested `set` now reads fresh root via `signal.get()`
- `store.ts` `combineSignals` — added `dispose()` that unsubscribes from source signals
- `store.ts` `createMediaQuery` — added `dispose()` that removes `change` listener
- `lifecycle.ts` `triggerOnMount` — guard against double invocation via `_mounted` flag
- `context.ts` `Provider.render` — uses stack instead of single value, so nested Providers restore outer value
- `devtools.ts` — capped `components`/`signals` arrays at 1000 entries to prevent unbounded growth

### hooks.ts bugfixes
- `useEventListener` — stale handler closure fixed (use `useRef` to always call latest handler)
- `useInterval`/`useTimeout` — stale `fn` closure fixed (use `savedFn.current`)
- `useDebouncedValue` — `timeoutId` now stored in `useRef` (was reset per render); added cleanup on unmount
- `useTransition` — added `pendingCount` counter for correct behavior with nested/overlapping transitions
- `useForm` — **no longer calls hooks inside a `for` loop** (was violating Rules of Hooks); uses single `useState` for all form data
- `useClipboard` — `setTimeout` ID stored in `useRef`; cleared on unmount; previous timeout cleared before new one
- `useOnlineStatus` — added SSR guard (`typeof window !== 'undefined'`)
- `useGeolocation` — added SSR guard + `unmountedRef` to prevent state updates after unmount
- `useWindowSize` — added SSR guard with default `{ width: 1024, height: 768 }`
- `useScrollPosition` — added SSR guard with default `{ x: 0, y: 0 }`
- `useIdleTimer` — added SSR guard (`typeof window === 'undefined'` early return)
- `useVirtualList` — added `containerRef.current` to useEffect deps (re-attaches scroll listener on ref change)
- `createEffect` — returned `() => void` now tracks unsubscribes instead of being a no-op

### Added
- Full type declarations in `veliom.d.ts` for all v0.2.x APIs (Scheduler, Plugin, KeepAlive, Transition, SSR, LIS, useVirtualList, createSuspense)
- Global `Window.__VELIOM_DEVTOOLS__` ambient declaration
- examples/features-demo.ts + features.html — interactive demo for v0.2.1 features
- `vite.config.ts` — multi-page build for all example HTML files
- ESLint linting for `examples/` directory

### Changed
- Remove dead `nodePool` from renderer.ts (unused, never populated)
- `EMPTY_ARR` frozen via `Object.freeze()` to prevent accidental mutation
- `TransitionProps.appear` removed (unimplemented)
- `renderToString` — `dangerouslySetInnerHTML` sets inner content, skips children rendering

## [0.2.1] - 2026-05-27

### Added
- RAF-Batching Scheduler (`scheduleDOMUpdate`/`flushDOMUpdates`) — queues DOM writes in a single `requestAnimationFrame`
- Longest Increasing Subsequence (`lis`) — O(n log n) keyed DOM reconciliation minimizing element moves
- Plugin System — 8 lifecycle hooks (`beforeCreate`→`unmounted`) via `usePlugin()`
- KeepAlive — component instance caching by key with `clearKeepAliveCache()`
- Transition — CSS class-based enter/leave animations with `transitionend` auto-cleanup
- SSR — `renderToString(vnode)` / `renderToStringWithData(vnode, data)` for server-side rendering
- DevTools — `window.__VELIOM_DEVTOOLS__` global hook exposing `getState`
- `useVirtualList` — virtual scrolling with `visibleItems`, `totalHeight`, `scrollTo`

### Changed
- renderer.ts `reconcileChildren` — LIS-based reorder (reverse iteration newTail→newHead for stable ref anchors)

### Infrastructure
- ESLint 0 warnings, TypeScript strict clean
- 19 test files, 280 tests passing
- `build` + `typecheck` pass on all source

## [0.2.0] - 2026-05-27

### Fixed
- renderer.ts: 7 critical bugs (portal type handling, reconcile refNode indexing, event listener cleanup, ref callback execution, nested set infinite loop, non-function event handler injection, VNode pool assumptions)
- component.ts: removed non-existent `_component` property, `ComponentInstance` WeakMap, proper lifecycle/effect integration
- store.ts: `batch()` deferred effects, `Set<Listener>` with `notifyingListeners` WeakSet guard, effect tracking stack, `createComputed` auto/explicit deps
- hooks.ts: `useEffect` via `queueMicrotask`, `useRef` separate `refCache`, `useReducer` added
- lifecycle.ts: `triggerOnMount` exported

### Added
- Context system: `createContext`, `useContext`, `provideContext`, `Context.Provider` JSX component
- `Await<T>` component — promise rendering with loading/error/resolved states
- `Teleport` — JSX portal to query selector or element ref target
- `ErrorBoundary` — error boundary component with lazy children and fallback
- `Dynamic` component — render string tag or component dynamically
- Control flow: `Switch`/`Match` (SolidJS-like), `For`/`Index` with optional `key` parameter
- `createResource` — reactive data fetching with loading/error/data/mutate/refetch
- `createDeepStore` — Proxy-based deep reactive store with subscribe
- `createMediaQuery` — reactive `Signal<boolean>` from `window.matchMedia`
- `createMemo` — auto-tracking computed with cached value
- `createAsync` — general promise/sync-to-signal primitive
- `combineSignals` — combine multiple signals into one derived signal
- `Children` utilities: `toArray`, `map`, `forEach`, `only`, `count`
- Event delegation cleanup: `detachEvent`/`detachAllEvents` remove unused container listeners
- XSS safety: `ATTR_ALIAS` map (`htmlFor`→`for`, `className`→`class`, etc.), `dangerouslySetInnerHTML`, `value`/`checked` direct props, style object support

### Hooks added
- `useTransition` — non-urgent updates via microtask
- `usePrevious` — track previous value
- `useDebouncedValue` — debounced derived signal
- `useEventListener` — auto-cleaned event listener
- `useInterval` / `useTimeout` — interval/timeout with pause (delay=null)
- `useMediaQuery` — reactive media query hook
- `useLocalStorage` — signal-backed localStorage with JSON serialization
- `useForm` — form state with validation (required, minLength, maxLength, pattern, custom)
- `useIntersectionObserver` — element visibility tracking
- `useResizeObserver` — element size tracking
- `useClipboard` — clipboard API with copied state
- `useDocumentTitle` — dynamic document title
- `useOnlineStatus` — `navigator.onLine` signal
- `usePreferredColorScheme` — `'light' | 'dark'` signal
- `useGeolocation` — geolocation API wrapper
- `useWindowSize` — window dimension signal
- `useKeyPress` — keyboard key press signal
- `useHover` — element hover state signal
- `useScrollPosition` — scroll position signal
- `useIdleTimer` — user idle detection

### Router
- `createRouter` — hash/history-based client-side routing
- `Route` — path matching with `:param` support and fallback
- `Link` — `<a>` with `preventDefault` navigation
- `useRouter` — route state accessor
- `onClickOutside` — capture-phase click detection

### Infrastructure
- ESLint installed + configured (flat config `eslint.config.js`), 0 warnings
- `vitest.config.ts` — separate test config for correct test discovery
- 19 test files, 280 tests total
- TypeScript strict-mode clean across all source files

---

## [0.1.0] - 2026-04-17

### Added
- Initial release
