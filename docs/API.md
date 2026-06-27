# Veliom - API Reference

## Table of Contents

1. [Core Functions](#core-functions)
2. [Components](#components)
3. [Plugin System](#plugin-system)
4. [KeepAlive](#keepalive)
5. [Transition](#transition)
6. [Control Flow](#control-flow)
7. [Router](#router)
8. [State Management](#state-management)
9. [Hooks](#hooks)
10. [Lifecycle](#lifecycle)
11. [Context](#context)
12. [Events](#events)
13. [Children Utilities](#children-utilities)
14. [Utilities](#utilities)
15. [Error Handling](#error-handling)
16. [Performance](#performance)
17. [Server-Side Rendering](#server-side-rendering)
18. [DevTools](#devtools)

---

## Core Functions

### `h(type, props?, ...children)`

Creates a virtual DOM node.

```typescript
import { h } from 'veliom';

h('div', { className: 'container' }, 'Hello');
h('div', null, h('h1', null, 'Title'), h('p', null, 'Description'));
h('button', { onClick: () => console.log('clicked') }, 'Click me');
h('div', { style: { color: 'red', fontSize: '16px' } });
h('div', { classList: ['foo', 'bar'] });
h('div', { classList: { active: true, disabled: false } });
h('div', { dangerouslySetInnerHTML: { __html: '<b>bold</b>' } });
```

Attribute aliases: `htmlFor`→`for`, `className`→`class`, `readOnly`→`readonly`, `htmlFor`→`for`, `crossOrigin`→`crossorigin`.

### `render(vnode, container)`

Renders a VNode to a DOM container.

```typescript
import { h, render } from 'veliom';
render(h('div', null, 'Hello World'), document.getElementById('app')!);
```

### `patch(container, oldVNode, newVNode)`

Patches the DOM with a new VNode.

```typescript
patch(container, oldVNode, newVNode);
```

### `createElement(type, props?, ...children)`

Alias for `h()`.

---

## Components

### `createComponent(fn)`

Creates a component. The factory runs once; the inner render function runs on every update.

```typescript
import { createComponent, createSignal, h } from 'veliom';

const Counter = createComponent(() => {
  const count = createSignal(0);
  return () => h('div', null,
    h('span', null, String(count.get())),
    h('button', { onClick: () => count.update(n => n + 1) }, '+')
  );
});
```

### `mount(component, container, props?)`

Mounts a component.

```typescript
mount(Counter, document.getElementById('app')!);
mount(Counter, container, { initialCount: 5 });
```

### `update(container, newProps)`

Updates component props.

```typescript
update(container, { newProp: 'value' });
```

### `unmount(container)`

Unmounts a component.

```typescript
unmount(container);
```

### `memo(component)`

Creates a memoized component with shallow prop comparison.

```typescript
const Expensive = memo((props) => {
  return () => h('div', null, props.data);
});
```

### `Dynamic`

Renders a component dynamically by tag name or component function.

```typescript
import { Dynamic, h } from 'veliom';

Dynamic({ component: 'div', props: { class: 'box' }, children: 'content' });
Dynamic({ component: MyComponent, props: { name: 'test' } });
```

### `ErrorBoundary`

Catches rendering errors and shows a fallback.

```typescript
import { ErrorBoundary, h } from 'veliom';

ErrorBoundary({
  fallback: (error) => h('div', null, `Error: ${error.message}`),
  children: () => h(MyComponent)
});
```

### `Await`

Renders a promise with loading/error/resolved states.

```typescript
import { Await, h } from 'veliom';

Await({
  promise: fetchUser(),
  loading: () => h('div', null, 'Loading...'),
  error: (err) => h('div', null, err.message),
  children: (user) => h('div', null, user.name)
});
```

### `Teleport`

Renders children to a different DOM target.

```typescript
import { Teleport, h } from 'veliom';

Teleport({ to: '#portal-root', children: h('div', null, 'Teleported') });
Teleport({ to: document.getElementById('modal')!, children: h('div', null, 'Modal') });
```

### `createPortal`

Programmatic portal.

```typescript
import { createPortal, h } from 'veliom';
createPortal(h('div', null, 'Portal'), document.body);
```

### `lazy(loader, options?)`

Creates a lazily-loaded component.

```typescript
const LazyComponent = lazy(() => import('./Heavy'), {
  fallback: h('div', null, 'Loading...')
});
```

### `Suspense`

Shows fallback while lazy components load.

```typescript
Suspense({ children: LazyComponent, fallback: h('div', null, 'Loading...') });
```

---

## Plugin System

### `usePlugin(plugin)`

Registers a plugin globally. All plugin hooks run synchronously on every component lifecycle event.

```typescript
import { usePlugin, Plugin } from 'veliom';

const logger: Plugin = {
  name: 'logger',
  hooks: {
    beforeCreate: (vnode) => console.log('creating', vnode.type),
    created: (vnode) => console.log('created', vnode.type),
    beforeMount: (vnode) => console.log('mounting', vnode.type),
    mounted: (vnode) => console.log('mounted', vnode.type),
    beforeUpdate: (vnode) => console.log('updating', vnode.type),
    updated: (vnode) => console.log('updated', vnode.type),
    beforeUnmount: (vnode) => console.log('unmounting', vnode.type),
    unmounted: (vnode) => console.log('unmounted', vnode.type),
  },
};

usePlugin(logger);
```

### `Plugin` type

```typescript
interface Plugin {
  name: string;
  hooks: PluginHooks;
}
```

### `PluginHooks`

| Hook | When |
|------|------|
| `beforeCreate` | Before VNode creation |
| `created` | After VNode creation |
| `beforeMount` | Before DOM insertion |
| `mounted` | After DOM insertion |
| `beforeUpdate` | Before DOM patch |
| `updated` | After DOM patch |
| `beforeUnmount` | Before DOM removal |
| `unmounted` | After DOM removal |

---

## KeepAlive

### `KeepAlive`

Caches a component's VNode + DOM element by key. On re-mount, restores the cached instance instead of creating a new one.

```typescript
import { KeepAlive, h } from 'veliom';

// Wrapped component is cached by key
KeepAlive({ key: 'tab-1', children: h(TabContent) });
KeepAlive({ key: 'tab-2', children: h(OtherTab) });
```

### `clearKeepAliveCache(key?)`

Clears the keep-alive cache.

```typescript
clearKeepAliveCache();      // clear all
clearKeepAliveCache('tab-1'); // clear specific
```

---

## Transition

### `Transition`

CSS class-based enter/leave animation component.

```typescript
import { Transition, h } from 'veliom';

Transition({ show: isVisible, name: 'fade',
  children: h('div', null, 'Animated content')
});
```

Applies CSS classes in order:
- Enter: `{name}-enter-from` → `{name}-enter-active` → `{name}-enter-to` (removes `-from`/`-to` on `transitionend`)
- Leave: `{name}-leave-from` → `{name}-leave-active` → `{name}-leave-to` (removes element on `transitionend`)

### `createTransitionClasses(element, name, onDone?)`

Manually applies enter classes to an element.

```typescript
createTransitionClasses(el, 'fade', () => console.log('enter complete'));
```

### `leaveTransition(element, name, onDone?)`

Manually applies leave classes and calls `onDone` after transition ends.

```typescript
leaveTransition(el, 'fade', () => console.log('leave complete'));
```

---

## Control Flow

### `Fragment`

Renders children without a wrapper.

```typescript
Fragment({ children: [h('h1', null, 'Title'), h('p', null, 'Desc')] });
```

### `Show`

Conditionally renders content.

```typescript
Show({ when: isLoggedIn, children: () => h('div', null, 'Welcome!'), fallback: h('div', null, 'Login') });
```

### `Switch` / `Match`

Pattern-matching conditional rendering (SolidJS-like).

```typescript
Switch({
  children: [
    Match({ when: status === 'loading', children: () => h('div', null, '...') }),
    Match({ when: status === 'error',   children: () => h('div', null, 'Error!') }),
    Match({ when: true,                 children: () => h('div', null, 'Ready') }),
  ]
});
```

### `For`

Renders a list with optional key.

```typescript
For({ each: items, key: 'id', children: (item, index) =>
  h('div', null, `${index}. ${item.name}`)
});
```

### `Index`

Renders a list with stable index access (element signal per item).

```typescript
Index({ each: items, children: (getItem, index) =>
  h('div', null, getItem().name)
});
```

---

## Router

### `createRouter(routes, options?)`

Creates a client-side router (hash or history mode).

```typescript
import { createRouter, Route, Link, useRouter } from 'veliom';

const router = createRouter([
  { path: '/', component: Home },
  { path: '/users/:id', component: UserProfile },
], { mode: 'hash' });
```

Returns `{ currentPath, params, navigate, resolve, dispose }`.

### `Route`

Matches a path and renders the component.

```typescript
h(Route, { path: '/', router, component: Home });
h(Route, { path: '/users/:id', router, component: UserProfile, fallback: NotFound });
```

### `Link`

Navigation link (prevents default, uses router navigate).

```typescript
h(Link, { to: '/home', router }, h('span', null, 'Home'));
```

### `useRouter(router)`

Access current route state.

```typescript
const { path, params, navigate } = useRouter(router);
```

---

## State Management

### `createSignal(initialValue)`

Creates a reactive signal.

```typescript
const count = createSignal(0);
count.get();       // 0
count.set(5);      // 5
count.update(n => n + 1);  // 6
const unsub = count.subscribe((val) => console.log(val));
unsub();           // unsubscribe
```

### `createStore(initialState)`

Reactive store with multiple properties.

```typescript
const store = createStore({ name: 'Veliom', count: 0 });
store.get('name');           // 'Veliom'
store.set('count', 10);
store.update('count', n => n + 1);
store.subscribe('count', (v) => console.log(v));
store.getState();            // { name: 'Veliom', count: 11 }
```

### `createDeepStore(initialState)`

Proxy-based deep reactive store.

```typescript
const store = createDeepStore({ users: [{ name: 'Alice' }] });
store.users[0].name;  // auto-tracked
const unsub = store.subscribe((next) => console.log(next));
store.users.push({ name: 'Bob' }); // triggers subscriber
```

### `createComputed(compute, deps?)`

Computed value (auto-tracking if no deps provided).

```typescript
const fullName = createComputed(() => `${firstName.get()} ${lastName.get()}`);
fullName.get();  // computed on demand
```

### `createMemo(compute)`

Auto-tracking memoized computation (eager, cached).

```typescript
const doubled = createMemo(() => count.get() * 2);
doubled.get();  // returns cached value, re-computes on signal change
```

### `createMediaQuery(query)`

Reactive media query signal.

```typescript
const isLarge = createMediaQuery('(min-width: 768px)');
isLarge.get();  // boolean
```

### `combineSignals(signals, compute)`

Combine multiple signals into one derived signal.

```typescript
const sum = combineSignals([a, b], () => a.get() + b.get());
sum.get();  // auto-updates when a or b change
```

### `createAsync(fetcher, initial?)`

General promise/sync-to-signal primitive.

```typescript
const { data, loading, error, refetch } = createAsync(
  () => fetch('/api/data').then(r => r.json())
);
data();     // T | undefined
loading();  // boolean
refetch();  // re-execute fetcher
```

### `createResource(fetcher, options?)`

Reactive data fetching.

```typescript
const [resource, { mutate, refetch }] = createResource(
  (id) => fetch(`/api/users/${id}`).then(r => r.json()),
  { initial: null }
);
resource().loading;   // boolean
resource().error;     // Error | null
resource().data;      // T | null
```

### `batch(fn)`

Defer effect notifications until the batch completes.

```typescript
batch(() => {
  count.set(1);
  name.set('Alice');
  // effects fire once after batch
});
```

---

## Hooks

All hooks must be called inside a `createComponent` factory function.

### `useState(initialValue)`

```typescript
const [getCount, setCount] = useState(0);
setCount(5);
setCount(c => c + 1);
```

### `useReducer(reducer, initialState)`

```typescript
const [state, dispatch] = useReducer((s, a) => s + a, 0);
dispatch(1);
```

### `useRef(initialValue?)`

```typescript
const el = useRef<HTMLDivElement>(null);
el.current?.focus();
```

### `useEffect(fn, deps?)`

```typescript
useEffect(() => {
  fetch('/api/data').then(setData);
  return () => cleanup();
}, []);
```

### `useMemo(fn, deps)`

```typescript
const doubled = useMemo(() => items().map(n => n * 2), [items]);
```

### `useCallback(fn, deps)`

```typescript
const handleClick = useCallback(() => console.log(count()), [count]);
```

### `useTransition()`

```typescript
const [isPending, startTransition] = useTransition();
startTransition(() => { /* non-urgent update */ });
isPending(); // true during transition
```

### `usePrevious(value)`

```typescript
const prevCount = usePrevious(count);
prevCount(); // undefined first call, previous value thereafter
```

### `useDebouncedValue(fn, delay)`

```typescript
const debounced = useDebouncedValue(() => search.get(), 300);
debounced(); // updated after 300ms of no changes
```

### `useEventListener(target, event, handler)`

```typescript
useEventListener(window, 'resize', () => console.log('resized'));
```

### `useInterval(fn, delay)`

```typescript
useInterval(() => tick(), 1000);
useInterval(() => tick(), null); // paused
```

### `useTimeout(fn, delay)`

```typescript
useTimeout(() => console.log('done'), 5000);
```

### `useMediaQuery(query)`

```typescript
const isMobile = useMediaQuery('(max-width: 768px)');
isMobile(); // boolean
```

### `useLocalStorage(key, defaultValue)`

```typescript
const [getTheme, setTheme] = useLocalStorage('theme', 'light');
setTheme('dark');
```

### `useForm(options)`

```typescript
const form = useForm({
  initialValues: { name: '', email: '' },
  validate: {
    name: { required: true, minLength: 2 },
    email: { required: true, pattern: /^[^@]+@[^@]+$/ },
  },
  onSubmit: (values) => console.log(values),
});

form.values();           // current values
form.errors();           // validation errors
form.setValue('name', 'Alice');
form.validate();         // returns boolean
form.handleSubmit();     // validates + calls onSubmit
form.submitted();        // true after first submit

const field = form.field('name');
field.value();           // current value
field.set('Bob');
field.error();           // string | undefined
```

### `useIntersectionObserver(target, options?)`

```typescript
const entry = useIntersectionObserver(elementRef, { threshold: 0.5 });
entry(); // IntersectionObserverEntry | null
```

### `useResizeObserver(target)`

```typescript
const rect = useResizeObserver(elementRef);
rect(); // DOMRectReadOnly | null
```

### `useClipboard()`

```typescript
const { copy, copied } = useClipboard();
await copy('text to copy');
copied(); // true for 2 seconds after copy
```

### `useDocumentTitle(title)`

```typescript
useDocumentTitle('My Page'); // sets document.title, restores on unmount
```

### `useOnlineStatus()`

```typescript
const isOnline = useOnlineStatus();
isOnline(); // boolean
```

### `usePreferredColorScheme()`

```typescript
const scheme = usePreferredColorScheme();
scheme(); // 'light' | 'dark'
```

### `useGeolocation(options?)`

```typescript
const { coords, error, loading } = useGeolocation();
loading();   // boolean
coords();    // GeolocationCoordinates | null
error();     // string | null
```

### `useWindowSize()`

```typescript
const size = useWindowSize();
size(); // { width: number, height: number }
```

### `useKeyPress(targetKey)`

```typescript
const isPressed = useKeyPress('Enter');
isPressed(); // boolean
```

### `useHover(element)`

```typescript
const isHovered = useHover(elementRef);
isHovered(); // boolean
```

### `useScrollPosition()`

```typescript
const scroll = useScrollPosition();
scroll(); // { x: number, y: number }
```

### `useIdleTimer(timeout?)`

```typescript
const isIdle = useIdleTimer(30000); // default 60s
isIdle(); // true after inactivity
```

### `useVirtualList(items, options)`

Virtual scrolling hook — renders only visible items.

```typescript
import { useVirtualList } from 'veliom';

const items = Array.from({ length: 10000 }, (_, i) => `Item ${i}`);

const { visibleItems, totalHeight, scrollTo } = useVirtualList(items, {
  itemHeight: 50,
  overscan: 5,
  containerRef: containerEl,
});

visibleItems(); // { index, data, offsetY }[] — only visible + overscan
totalHeight();  // total scroll height
scrollTo(500);  // scroll to pixel position
```

### `createEffect(fn)` / `createEffect(signal, callback)`

```typescript
// Auto-tracking mode
createEffect(() => { console.log(count.get()); });

// Explicit mode (backward compatible)
createEffect(count, (val) => console.log(val));
```

---

## Lifecycle

### `onMount(fn)`

```typescript
onMount(() => {
  console.log('mounted');
  return () => console.log('cleanup on unmount');
});
```

### `onUpdate(fn)`

```typescript
onUpdate((prevProps) => {
  console.log('props changed from:', prevProps);
});
```

### `onUnmount(fn)`

```typescript
onUnmount(() => console.log('cleanup!'));
```

---

## Context

### `createContext(defaultValue)`

```typescript
import { createContext, useContext, provideContext, h } from 'veliom';

const Theme = createContext('light');

// Provider as direct function call
Theme.Provider({ value: 'dark', children: h(Consumer) });

// Consume
const theme = useContext(Theme); // 'dark'

// Programmatic
provideContext(Theme, 'dark');
```

---

## Events

### `onClickOutside(element, handler, options?)`

Detects clicks outside an element (capture phase).

```typescript
import { onClickOutside } from 'veliom';

onClickOutside(el, () => console.log('clicked outside'));
onClickOutside(el, handler, { enabled: isOpen }); // conditional
onClickOutside(null, handler); // noop when element is null
```

---

## Children Utilities

### `Children.toArray(children)`

Flattens nested fragments recursively into a flat array.

```typescript
import { Children } from 'veliom';
Children.toArray(children); // VNode[]
```

### `Children.map(children, fn)`

Maps over children with flattening.

### `Children.forEach(children, fn)`

Iterates over children with flattening.

### `Children.only(children)`

Returns the single child, throws if count ≠ 1.

### `Children.count(children)`

Returns total number of children (after flattening).

---

## Utilities

### `createRef()`

```typescript
const ref = createRef<HTMLInputElement>();
// use as: h('input', { ref })
ref.current?.focus();
```

### `mergeRefs(...refs)`

Merges multiple refs into one callback ref.

### `createSuspense()`

Creates a suspense boundary.

### `preload(lazyComponent)`

Preloads a lazy component.

### `setPortalContainer(selector)`

Sets the default portal container.

---

## Error Handling

### `createErrorBoundary(fallback, onError?)`

```typescript
const Safe = createErrorBoundary(
  (error) => h('div', null, `Error: ${error.message}`),
  (error, info) => console.error(error, info)
);
```

### `setGlobalErrorHandler(handler)`

```typescript
setGlobalErrorHandler((error, info) => {
  reportError(error);
});
```

### `getGlobalErrorHandler()`

Returns the current global error handler.

### `reportError(error)`

Reports an error to the global handler.

---

## Performance

### `scheduleDOMUpdate(fn)`

Queues a DOM write to run in the next `requestAnimationFrame` callback. Batches multiple writes into a single frame.

```typescript
import { scheduleDOMUpdate, flushDOMUpdates } from 'veliom';

scheduleDOMUpdate(() => {
  el.style.width = `${newWidth}px`;
});
```

### `flushDOMUpdates()`

Immediately flushes any pending DOM updates (useful for testing).

```typescript
flushDOMUpdates(); // pending callbacks run synchronously
```

### `longestIncreasingSubsequence(sequence)`

Returns indices forming the longest increasing subsequence (O(n log n)). Used internally by keyed reconciliation for minimal DOM moves.

```typescript
import { longestIncreasingSubsequence } from 'veliom';

const indices = longestIncreasingSubsequence([0, 8, 4, 12, 2]);
// [0, 2, 3] (values: 0, 4, 12)
```

### `benchmark(name, fn, options?)`

Runs a performance benchmark.

```typescript
const result = benchmark('My op', () => { /* code */ }, { iterations: 1000 });
console.log(result.opsPerSecond);
```

### `compareBenchmarks(...results)`

Compares multiple benchmark results.

```typescript
compareBenchmarks(result1, result2);
```

### `runPerformanceTests()`

Runs predefined performance tests.

---

## Server-Side Rendering

### `renderToString(vnode)`

Converts a VNode tree to an HTML string. Supports fragments, portals (renders children only), text nodes, and void elements.

```typescript
import { renderToString, h } from 'veliom';

const html = renderToString(h('div', { class: 'app' },
  h('h1', null, 'Hello SSR'),
  h('p', null, 'Server rendered content')
));
// '<div class="app"><h1>Hello SSR</h1><p>Server rendered content</p></div>'
```

Function components return empty string (run-time only).

### `renderToStringWithData(vnode, data)`

Renders VNode to HTML and appends a `<script>` tag with `window.__INITIAL_DATA__` for client hydration.

```typescript
const html = renderToStringWithData(appVNode, { user: { id: 1, name: 'Alice' } });
// '<div>...</div><script>window.__INITIAL_DATA__=...</script>'
```

---

## DevTools

### `enableDevTools()` / `disableDevTools()`

Opt-in devtools integration. Not active by default — must be explicitly enabled.

```typescript
import { enableDevTools, disableDevTools, isDevToolsEnabled } from 'veliom';

enableDevTools(); // registers window.__VELIOM_DEVTOOLS__

const devtools = (window as any).__VELIOM_DEVTOOLS__;
const state = devtools.getState();
// { components: VNode[], signals: { name: string, value: any }[] }

disableDevTools(); // removes window.__VELIOM_DEVTOOLS__
isDevToolsEnabled(); // boolean
```
