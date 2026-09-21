import type { ComponentProps } from '../core/component.js';

type LifecycleHook = () => void | (() => void);
type CleanupFn = () => void;

export interface LifecycleCallbacks {
  onMount?: LifecycleHook;
  onUpdate?: (prevProps: ComponentProps) => void;
  onUnmount?: CleanupFn;
}

const mountedSet = new WeakSet<LifecycleCallbacks>();

export function triggerOnMount(callbacks: LifecycleCallbacks): void {
  if (mountedSet.has(callbacks)) return;
  mountedSet.add(callbacks);
  if (callbacks.onMount) {
    const cleanup = callbacks.onMount();
    if (typeof cleanup === 'function') {
      const originalUnmount = callbacks.onUnmount;
      callbacks.onUnmount = () => {
        cleanup();
        originalUnmount?.();
      };
    }
  }
}

export function onMount(fn: LifecycleHook): void {
  const callbacks = getCurrentLifecycle();
  if (!callbacks) {
    console.warn('Veliom: onMount called outside a component — no-op');
    return;
  }
  const original = callbacks.onMount;
  callbacks.onMount = () => {
    original?.();
    const cleanup = fn();
    if (typeof cleanup === 'function') {
      const originalUnmount = callbacks.onUnmount;
      callbacks.onUnmount = () => {
        cleanup();
        originalUnmount?.();
      };
    }
  };
}

export function onUpdate(fn: (prevProps: ComponentProps) => void): void {
  const callbacks = getCurrentLifecycle();
  if (!callbacks) {
    console.warn('Veliom: onUpdate called outside a component — no-op');
    return;
  }
  const original = callbacks.onUpdate;
  callbacks.onUpdate = (prevProps: ComponentProps) => {
    original?.(prevProps);
    fn(prevProps);
  };
}

export function onUnmount(fn: CleanupFn): void {
  const callbacks = getCurrentLifecycle();
  if (!callbacks) {
    console.warn('Veliom: onUnmount called outside a component — no-op');
    return;
  }
  const original = callbacks.onUnmount;
  callbacks.onUnmount = () => {
    fn();
    original?.();
  };
}

const lifecycleStack: LifecycleCallbacks[] = [];

export function pushLifecycleContext(ctx?: LifecycleCallbacks): LifecycleCallbacks {
  const context = ctx ?? {};
  lifecycleStack.push(context);
  return context;
}

export function popLifecycleContext(): void {
  lifecycleStack.pop();
}

export function getCurrentLifecycle(): LifecycleCallbacks | undefined {
  return lifecycleStack[lifecycleStack.length - 1];
}
