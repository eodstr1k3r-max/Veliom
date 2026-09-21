# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.3.9] - 2026-09-21

### Added
- Callable components: `createComponent`/`memo`/`lazy` results and `Context.Provider` are directly callable (`Counter({})`, `Modal({...})`) with inner render functions resolved. `.render()` stays raw for the mount/update pipeline; `mount()` no longer double-wraps already-created components. The composition pattern documented since v0.3.7 now actually works.
- `npm run test:coverage` with v8 provider and enforced thresholds (85% lines/statements, 78% branches, 74% functions over `src/**/*.ts`); `@vitest/coverage-v8@1` devDependency.
- Exported `isSafePath` from the router for user-side target validation.

### Fixed (Security)
- `ssr.ts` — `attrsToString` serialized `href`/`src`/`action` without protocol checks, so SSR output could contain `javascript:`/`data:`/`vbscript:` URLs that the DOM renderer blocks. SSR now filters them (parity with `isSafeAttribute`).
- `utils/sanitize.ts` — `sanitizeHtml` stripped only `<script>` tags. It now also removes event-handler attributes (`on*`), neutralizes `javascript:`/`vbscript:`/`data:text/html` URLs, and drops `<iframe>`/`<object>`/`<embed>`/`<link>`/`<meta>`/`<base>`/`<form>` tags.
- `core/router.ts` — `isSafePath` now requires absolute `/` paths, rejects protocol-relative `//evil`, whitespace/quotes/backslashes, and encoded bypasses (`%6Aavascript:`).

### Fixed (Correctness)
- `state/store.ts` — `createComputed`/`createMemo` auto-tracking discarded the `popTrackingEffect()` cleanup, leaking stale signal subscriptions on conditional dep switches. Both now dispose before re-tracking.
- `state/store.ts` — `createDeepStore` ignored arrays and had no `deleteProperty` trap (`push()` was silent). Arrays are proxied; `delete` bumps the version.
- `core/renderer.ts` — LIS `stable` set mis-mapped positions when inserts were present (unnecessary DOM moves). Source indices are now mapped back to new positions.
- `core/renderer.ts` — portal patching reconciled against the wrong container. Portals are now torn down and re-mounted into their target; `patch()` handles `empty` explicitly.
- `core/renderer.ts` — style patch used `Object.assign` (breaks hyphenated keys/custom properties). Mount + patch share `applyStyleValue` with camelCase→kebab normalization; `removeStyleKeys` clears via IDL + `removeProperty`.
- `core/component.ts` (`memo`) — `children` is now compared (was ignored) and cache hits return a ref-free clone (was shared identity).
- `core/keepAlive.ts` — no more `createElement` side-effect during render; pure LRU snapshot cache.
- `state/hooks.ts` (`useVirtualList`) — scroll listener attaches on every render (no-deps effect), fixing late-mounted containers never getting a listener.
- `core/transition.ts`, `utils/events.ts`, `useDocumentTitle`, `useKeyPress` — SSR guards (`requestAnimationFrame`/`document`/`window`).
- `core/suspense.ts` (`preload`), `core/plugin.ts` (dedupe with warning), `state/lifecycle.ts` + `provideContext` (warn instead of silent no-op).
- `state/hooks.ts` — `useIntersectionObserver`/`useResizeObserver` crashed asynchronously where the APIs don't exist (jsdom, older browsers). Both warn and stay `null`.
- `vite.config.ts` — ESM-safe `__dirname` via `fileURLToPath`; `release.yml` runs `npm run smoke`; `lint` covers `tests/`.
- `core/component.ts` (`update`) — **hook state loss (high)**: re-render reused the mount-time context without resetting `effectIndex`, so every `update()` allocated fresh `useState`/`useRef` slots (state reset), missed all `useMemo` caches, and duplicated `useEffect`s. Slots now replay from 0.
- `core/renderer.ts` — **portal events dead (high)**: delegation listened on the render container, but portal DOM lives outside it — `onClick` etc. inside portals/teleport/modals never fired (incl. the advanced-demo modal close button). Delegation now listens at `document` level (container fallback); also fixes standalone `createElement` trees.
- `core/router.ts` (`Link`) — unsafe `to` targets were only blocked on left-click; middle-click/new-tab followed the raw href. `Link` now validates via exported `isSafePath`, warns, and falls back to `#/` (clicks on unsafe targets are no-ops).
- `core/scheduler.ts` — callbacks scheduled from inside an rAF flush were stranded until the next unrelated schedule. `flushQueue` now drains follow-ups with a new frame.
- `core/transition.ts` — `transitioncancel` listener was never removed (accumulated on repeatedly animated elements). Both listeners are now removed in `finish`.
- `state/lifecycle.ts` — removed dead `registerLifecycle`/`unregisterLifecycle`/`getLifecycle` registry (unused parallel system; also dropped from the public entry).
- `core/renderer.ts` — **portal/fragment removal (high)**: dropping a portal child crashed (`parent.removeChild()` on the portal *target*, e.g. `document.body`); fragment children leaked delegated listeners (skipped `removeVNode`). New `removeChildTree` helper handles elements/text/fragments/portals; `removeVNode` no longer detaches listeners from portal targets; `patch()` portal→empty and keyed portal moves fixed.
- `core/renderer.ts` (`h`) — nested arrays as children (missing spread) silently produced corrupt `<undefined>` elements. Children are now flattened recursively (React parity).
- `core/control.ts` (`Fragment`) — accepts a single child VNode (normalized to an array).
- `core/component.ts` (`mount`) — remounting over a live instance leaked effects/lifecycle/delegation entries. Previous instance is now unmounted first.
- `utils/benchmark.ts` (`compareBenchmarks`) — crashed with zero arguments. Early return.
- `state/hooks.ts` (`useForm`) — global/sticky `pattern` regexes are stateful (`lastIndex`); repeated validations alternated pass/fail. `lastIndex` is reset before each test.
- `state/store.ts` (`createMediaQuery`) — crashed where `window.matchMedia` is not a function. Now guarded (returns `false` + working `dispose`).
- `utils/benchmark.ts` — `iterations: 0` produced `NaN` stats; counts are clamped (`iterations ≥ 1`).
- `core/teleport.ts` — unknown string selectors silently fell back to `document.body`. Now renders empty with a console warning.
- `examples/` — fixed crashing patterns in all 5 demos: direct calls on `createComponent` results (`Modal({...})`, `TabA({})` → `.render(...)`; now also valid as direct calls), signal-tuple destructuring (`const [x, setX] = createSignal()` → `.get()/.set()`), function-valued `Show` fallbacks (must be VNodes), unspread array children in `VirtualListDemo`, inverted preload logic and `as any` casts in `lazy-demo.ts`.
- `examples/` — new `router-demo.ts` + `router-demo.html` (hash router with Home/About/User `:id` routes, `Link` nav, `useRouter` params, `NotFound` fallback), registered in `vite.config.ts`.

### Tests
- New `tests/hardening.test.ts` (38 tests): SSR protocol parity, sanitizer hardening, style normalization, deep-store arrays, tracking disposal, keyed inserts, memo/KeepAlive semantics + LRU, plugin dedupe, context/lifecycle guards, suspense preload, transitioncancel cleanup, router bypasses, Teleport target handling, `useForm` global regex, `createMediaQuery` without `matchMedia`, benchmark guards, devtools wiring.
- New `tests/integration.test.ts` (11 tests): nested mount/update/unmount, event-delegation cleanup, router Link→Route flow, portal placement, lazy/Suspense flow, ErrorBoundary flow, context provider flow, Transition+KeepAlive trees, SSR/DOM parity — all through the public `src/veliom.ts` entry.
- New `tests/examples.test.ts` (6 tests): all 6 examples mount into `#app` and render expected content — guards against component-call, fallback, and API drift in `examples/`.
- Callable-component tests (7): direct calls, inner-fn resolution, mount without re-wrap, memo/lazy callables, `Dynamic` with created components, direct `Provider` call.
- Hook-state-across-update tests (3): `useState`/`useRef`/`useMemo` preservation, no effect duplication.
- Misc hardening (4): Teleport unknown target, `useForm` global regex, `createMediaQuery` without `matchMedia`, benchmark zero-iteration guard.
- Removal/normalization tests (7): portal child removal, portal→empty, portal listener isolation, `h()` flattening, single-child `Fragment`, mount-remount cleanup, empty `compareBenchmarks`.
- Delegation/link/observer tests (6): portal click delivery + cleanup, unsafe `Link` targets, observer unavailability.
- Scheduler/transition/LRU tests (5): chained-flush delivery, sync flush + drain, `transitioncancel` cleanup, LRU eviction.
- Total: 423 tests across 26 files.

### Infrastructure
- New `npm run size` budget gate (ESM JS ≤ 150 KB raw; currently ~103 KB raw / ~28 KB gzip), wired into CI `build` job, `release.yml`, and `prepublishOnly`.

### Docs
- `docs/API.md` — header v0.3.9; documented callable components, memo clone semantics, KeepAlive purity/LRU, router path rules, deep-store arrays, computed/memo disposal, `useVirtualList` resubscribe, SSR protocol filtering, style normalization/sanitizer scope.
- `README.md` — new "What's New in v0.3.9" section; test counts (397); `test:coverage` command.
- `CONTRIBUTING.md` — removed deleted `src/veliom.d.ts` from the structure, updated sanitize description, added `smoke`/`size`/`test:coverage` commands, fixed the single-file test command and the (previously broken) coverage instructions, extended the PR checklist.

## [0.3.8] - 2026-08-29

### Docs
- `docs/API.md` — attribute alias list completed (`classList`→`class`, `formAction`→`formaction`, etc.), `createElement` import path corrected, `Theme.Provider` example uses direct calls, `Transition`/`onClickOutside`/`useVirtualList`/`renderToString` descriptions aligned with the implementation, `renderToString` SSR notes updated (style objects, classList, all portal children).
- `README.md` — added "What's New in v0.3.7" section, ESM & CJS badge, `npm run smoke` command, corrected Transition leave-class docs, zero-runtime-dependencies note.
- `examples/` — version strings bumped to v0.3.7.
- `package-lock.json` resynced.

## [0.3.7] - 2026-08-29

> **Note:** v0.3.6 was briefly published to npm with a broken build (extensionless ESM imports, CJS files treated as ESM). npm does not allow overwriting a published version, so the build fixes ship as **0.3.7**. Users of 0.3.6 should upgrade to 0.3.7.

### Fixed (Security)
- `renderer.ts` — `formAction` protocol injection bypass: `DANGEROUS_ATTRS` listed `'formAction'` (camelCase) but the check lowercases the key, so `javascript:`/`data:`/`vbscript:` URLs in `formaction` were never blocked (CWE-79). List now uses the lowercase `'formaction'`.

### Fixed (High)
- `renderer.ts` — text nodes were never assigned `vnode.ref`, so `reconcile()` could not remove them: removing text children via patch left orphaned text nodes in the DOM. Text VNodes now carry their `Text` node as `ref` (VNode.ref widened to `Element | Text`).
- `renderer.ts` — `patchVNode` updated text when `newVNode.type === 'text'` regardless of the old node type, so replacing an element with a text node silently wrote `.data` on an element and kept the old element in the DOM. Only `old.type === 'text'` takes the text patch path now; everything else goes through `replaceChild`.
- `renderer.ts` — re-rendering into the same container kept stale entries in `eventMap` after `container.innerHTML = ''`, so destroyed elements kept delegation entries. `render()` now clears `eventMap`/`containerListeners` when the container changes.
- `renderer.ts` — patching `style={{a, b}}` → `style={{a}}` left `b` applied via `style.cssText` semantics; removed-style keys are now explicitly cleared and `null`/`undefined`/`false` style values remove the property.
- `component.ts` — `unmount()` never walked the VNode tree, leaking event-delegation entries and skipping plugin unmount hooks. `removeVNode()` is now exported and called from `unmount()`.

### Fixed (Medium)
- `component.ts` — `createComponent(() => () => VNode)` (inner render function, the documented README pattern) crashed with "result is not a function". `resolveRenderResult()` resolves render functions in `mount`, `update` and `memo`.
- `store.ts` — `createSignal` methods referenced `this`, so destructured `set`/`update` threw `Cannot read properties of undefined`. Methods now close over the local `set`.
- `store.ts` — `createDeepStore` still spread the whole state tree on every mutation (`O(n)`); the O(1) version-counter signal documented in v0.3.5 is now actually implemented.
- `hooks.ts` — `useEffect(fn)` without a deps array only ran once (first mount); it now runs after every render with the previous cleanup, matching React semantics. `useEffect(fn, [])` is unchanged.
- `hooks.ts` — `createEffect(fn, callback)` or a non-signal source crashed with a confusing `TypeError`; both now throw descriptive errors.
- `router.ts` — `dispose()` accessed `window` unconditionally, crashing during SSR. Guarded with `typeof window === 'undefined'`.

### Fixed (Build / Publishing)
- All relative imports in `src/` now use explicit `.js` extensions — the generated `dist/` ESM files previously had extensionless imports, which fail in native Node ESM (`ERR_MODULE_NOT_FOUND`). Verified via fresh install + `import` from Node.
- `dist/cjs/package.json` (`{"type":"commonjs"}`) is now emitted by the build — without it, `require('veliom')` under Node ≥ 22 treated the `.js` CJS files as ESM (package root has `"type": "module"`) and crashed with `exports is not defined`. Verified via fresh install + `require()`.
- Removed `src/veliom.d.ts` — an outdated hand-maintained duplicate of the generated `dist/veliom.d.ts` that nobody referenced and could silently diverge from the actual types.
- Added `smoke:esm` / `smoke:cjs` / `smoke` npm scripts that import/require the freshly built `dist` under Node; `prepublishOnly` now runs them after the build so broken ESM/CJS output can never be published again.

### Changed (SSR parity)
- `ssr.ts` — `style` objects are now serialized to CSS text (`color:red;font-size:14px;`) instead of `[object Object]`; `classList` (array/object) maps to `class`; portal VNodes render all children instead of only the first.
- `veliom.ts` — deduplicated the redundant second `useVirtualList` export; added `removeVNode` to the public API.

### Changed (Docs & Examples)
- `docs/API.md` — corrected stale signatures (`createElement(vnode)`, `Dynamic` flat props, `For` key function, `createResource` object API, `createDeepStore.state`, `useVirtualList` options, `onClickOutside` boolean arg, `createPortal` object API, `createSuspense(fallback)`, `Transition` enter-only), replaced `h(Component)` calls with direct calls (`Route`, `Link`, `KeepAlive`, `ErrorBoundary`, `Theme.Provider`), documented `removeVNode` and the new `useEffect` no-deps semantics.
- `README.md` — same corrections (direct component calls, `createPortal`/`createResource`/`createDeepStore`/`For`/`onClickOutside` signatures), version badges updated, project structure now matches the actual files.
- `examples/` — version strings bumped to v0.3.7 (`features-demo.ts`, `advanced-demo.ts`, `features.html`); `features-demo.ts` now calls components directly (`TabA({})`, `KeepAliveDemo({})`) instead of `h(Component)` and calls `enableDevTools()` before mount; new `lazy-demo.html` added and registered in `vite.config.ts` (the lazy demo previously had no page and was not built).

### Infrastructure
- Added `.gitignore` — `node_modules/`, `dist/`, `coverage/`, `.npmrc` (registry credentials), logs, editor/OS files, `.env`, `*.tsbuildinfo`, Vite cache. Previously `dist/`, `node_modules/` and other artifacts were untracked.
- `package.json` — `files` now includes `dist` (the published tarball previously omitted the build output that `main`/`types`/`exports` point at).
- `package-lock.json` — resynced to 0.3.7 (was stuck at 0.2.0).

### Tests
- New `tests/fixes.test.ts` (27 tests): formAction injection, text-node lifecycle, style diffing, signal destructuring, deep-store version counter, unmount/event-map cleanup, `useEffect` no-deps semantics, `createEffect` guards, SSR serialization, inner render functions.
- Total: 349 tests across 22 files.

## [0.3.5] - 2026-07-25