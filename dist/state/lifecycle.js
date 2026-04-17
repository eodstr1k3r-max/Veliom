const lifecycleRegistry = new WeakMap();
export function registerLifecycle(instance, callbacks) {
    lifecycleRegistry.set(instance, callbacks);
}
export function unregisterLifecycle(instance) {
    const callbacks = lifecycleRegistry.get(instance);
    if (callbacks?.onUnmount) {
        callbacks.onUnmount();
    }
    lifecycleRegistry.delete(instance);
}
export function getLifecycle(instance) {
    return lifecycleRegistry.get(instance);
}
export function onMount(fn) {
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
export function onUpdate(fn) {
    const callbacks = getCurrentLifecycle();
    if (callbacks) {
        const original = callbacks.onUpdate;
        callbacks.onUpdate = (prevProps) => {
            original?.(prevProps);
            fn(prevProps);
        };
    }
}
export function onUnmount(fn) {
    const callbacks = getCurrentLifecycle();
    if (callbacks) {
        const original = callbacks.onUnmount;
        callbacks.onUnmount = () => {
            fn();
            original?.();
        };
    }
}
const lifecycleStack = [];
export function pushLifecycleContext() {
    const ctx = {};
    lifecycleStack.push(ctx);
    return ctx;
}
export function popLifecycleContext() {
    lifecycleStack.pop();
}
export function getCurrentLifecycle() {
    return lifecycleStack[lifecycleStack.length - 1];
}
export function createLifecycleHook(hook) {
    return ((fn) => {
        hook(fn);
    });
}
export function createSyncLifecycleHook(hook, callbackKey) {
    return ((fn) => {
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
            }
            else {
                callbacks.onUnmount = () => {
                    fn();
                    original?.();
                };
            }
        }
    });
}
