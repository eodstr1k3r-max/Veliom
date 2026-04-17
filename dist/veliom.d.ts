export { h, render, patch, VNode, DOMNode, setEventContainer } from './core/renderer';
export { createComponent, mount, update, unmount, Component, ComponentProps, ComponentRender, ComponentInstance, } from './core/component';
export { createSignal, createStore, createComputed, Signal, Store, Computed, } from './state/store';
export { useEffect, useMemo, useCallback, useState, createEffect, } from './state/hooks';
export { onMount, onUpdate, onUnmount, registerLifecycle, unregisterLifecycle, getLifecycle, } from './state/lifecycle';
export { createRef, mergeRefs, Ref, RefCallback, RefObject, } from './core/refs';
export { Fragment, Show, For, Index, } from './core/control';
export { createErrorBoundary, setGlobalErrorHandler, getGlobalErrorHandler, reportError, ErrorBoundaryState, ErrorInfo, ErrorHandler, } from './core/error';
export { createPortal, setPortalContainer, PortalProps, } from './core/portal';
export { lazy, preload, LazyComponent, LazyOptions, } from './core/lazy';
export { Suspense, createSuspense, SuspenseProps, } from './core/suspense';
export { benchmark, compareBenchmarks, runPerformanceTests, BenchmarkResult, BenchmarkOptions, } from './utils/benchmark';
//# sourceMappingURL=veliom.d.ts.map