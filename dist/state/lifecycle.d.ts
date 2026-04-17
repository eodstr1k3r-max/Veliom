import type { ComponentInstance, ComponentProps } from '../core/component';
type LifecycleHook = () => void | (() => void);
type CleanupFn = () => void;
interface LifecycleCallbacks {
    onMount?: LifecycleHook;
    onUpdate?: (prevProps: ComponentProps) => void;
    onUnmount?: CleanupFn;
}
export declare function registerLifecycle(instance: ComponentInstance, callbacks: LifecycleCallbacks): void;
export declare function unregisterLifecycle(instance: ComponentInstance): void;
export declare function getLifecycle(instance: ComponentInstance): LifecycleCallbacks | undefined;
export declare function onMount(fn: LifecycleHook): void;
export declare function onUpdate(fn: (prevProps: ComponentProps) => void): void;
export declare function onUnmount(fn: CleanupFn): void;
export declare function pushLifecycleContext(): LifecycleCallbacks;
export declare function popLifecycleContext(): void;
export declare function getCurrentLifecycle(): LifecycleCallbacks | undefined;
export declare function createLifecycleHook<T extends LifecycleHook>(hook: (fn: T) => void): T;
export declare function createSyncLifecycleHook<T extends LifecycleHook>(hook: (fn: T) => void, callbackKey: 'onMount' | 'onUnmount'): T;
export {};
//# sourceMappingURL=lifecycle.d.ts.map