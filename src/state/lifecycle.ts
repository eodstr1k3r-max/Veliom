import type { ComponentInstance, ComponentProps } from '../core/component';

type LifecycleHook = () => void | (() => void);
type CleanupFn = () => void;

interface LifecycleCallbacks {
  onMount?: LifecycleHook;
  onUpdate?: (prevProps: ComponentProps) => void;
  onUnmount?: CleanupFn;
}

const lifecycleRegistry = new WeakMap<ComponentInstance, LifecycleCallbacks>();

export function registerLifecycle(
  instance: ComponentInstance,
  callbacks: LifecycleCallbacks
): void {
  lifecycleRegistry.set(instance, callbacks);
}

export function unregisterLifecycle(instance: ComponentInstance): void {
  const callbacks = lifecycleRegistry.get(instance);
  if (callbacks?.onUnmount) {
    callbacks.onUnmount();
  }
  lifecycleRegistry.delete(instance);
}

export function getLifecycle(instance: ComponentInstance): LifecycleCallbacks | undefined {
  return lifecycleRegistry.get(instance);
}

export function onMount(fn: LifecycleHook): void {
  const callbacks = getCurrentLifecycle();
  if (callbacks) {
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
}

export function onUpdate(fn: (prevProps: ComponentProps) => void): void {
  const callbacks = getCurrentLifecycle();
  if (callbacks) {
    const original = callbacks.onUpdate;
    callbacks.onUpdate = (prevProps: ComponentProps) => {
      original?.(prevProps);
      fn(prevProps);
    };
  }
}

export function onUnmount(fn: CleanupFn): void {
  const callbacks = getCurrentLifecycle();
  if (callbacks) {
    const original = callbacks.onUnmount;
    callbacks.onUnmount = () => {
      fn();
      original?.();
    };
  }
}

const lifecycleStack: LifecycleCallbacks[] = [];

export function pushLifecycleContext(): LifecycleCallbacks {
  const ctx: LifecycleCallbacks = {};
  lifecycleStack.push(ctx);
  return ctx;
}

export function popLifecycleContext(): void {
  lifecycleStack.pop();
}

export function getCurrentLifecycle(): LifecycleCallbacks | undefined {
  return lifecycleStack[lifecycleStack.length - 1];
}

export function createLifecycleHook<T extends LifecycleHook>(
  hook: (fn: T) => void
): T {
  return ((fn: T) => {
    hook(fn);
  }) as T;
}

export function createSyncLifecycleHook<T extends LifecycleHook>(
  hook: (fn: T) => void,
  callbackKey: 'onMount' | 'onUnmount'
): T {
  return ((fn: T) => {
    const callbacks = getCurrentLifecycle();
    if (callbacks) {
      const original = callbacks[callbackKey];
      if (callbackKey === 'onMount') {
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
      } else {
        callbacks.onUnmount = () => {
          fn();
          original?.();
        };
      }
    }
  }) as T;
}
