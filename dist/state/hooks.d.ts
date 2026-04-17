import type { Signal } from './store';
export type CleanupFn = () => void;
export type EffectFn = () => CleanupFn | void;
interface Effect {
    fn: EffectFn;
    deps: unknown[];
    cleanup?: CleanupFn;
}
interface Context {
    effects: Effect[];
    memoCache: Map<string, {
        deps: unknown[];
        value: unknown;
    }>;
    effectIndex: number;
}
export declare function pushComponentContext(): Context;
export declare function popComponentContext(): void;
export declare function getCurrentContext(): Context | undefined;
export declare function useEffect(fn: EffectFn, deps?: unknown[]): void;
export declare function runEffects(): void;
export declare function cleanupEffects(): void;
export declare function useMemo<T>(fn: () => T, deps: unknown[]): T;
export declare function useCallback<T extends (...args: unknown[]) => unknown>(fn: T, deps: unknown[]): T;
export declare function useState<T>(initialValue: T): [() => T, (value: T | ((prev: T) => T)) => void];
export declare function createEffect<T>(source: Signal<unknown>, fn: (value: T) => void): () => void;
export {};
//# sourceMappingURL=hooks.d.ts.map