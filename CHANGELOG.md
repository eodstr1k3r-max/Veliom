# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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