# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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