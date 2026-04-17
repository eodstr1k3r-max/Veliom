const contextStack = [];
export function pushComponentContext() {
    const ctx = { effects: [], memoCache: new Map(), effectIndex: 0 };
    contextStack.push(ctx);
    return ctx;
}
export function popComponentContext() {
    contextStack.pop();
}
export function getCurrentContext() {
    return contextStack[contextStack.length - 1];
}
export function useEffect(fn, deps = []) {
    const ctx = getCurrentContext();
    if (!ctx)
        throw new Error('useEffect must be called inside a component');
    const idx = ctx.effectIndex++;
    const existingEffect = ctx.effects[idx];
    if (existingEffect && depsEqual(existingEffect.deps, deps)) {
        return;
    }
    if (existingEffect?.cleanup) {
        existingEffect.cleanup();
    }
    ctx.effects[idx] = { fn, deps, cleanup: undefined };
    const cleanup = fn();
    if (typeof cleanup === 'function') {
        ctx.effects[idx].cleanup = cleanup;
    }
}
export function runEffects() {
    const ctx = getCurrentContext();
    if (!ctx)
        return;
    for (let i = 0; i < ctx.effects.length; i++) {
        const effect = ctx.effects[i];
        if (!effect)
            continue;
        if (effect.cleanup) {
            effect.cleanup();
            effect.cleanup = undefined;
        }
        const cleanup = effect.fn();
        if (typeof cleanup === 'function') {
            effect.cleanup = cleanup;
        }
    }
}
export function cleanupEffects() {
    const ctx = getCurrentContext();
    if (!ctx)
        return;
    for (let i = 0; i < ctx.effects.length; i++) {
        const effect = ctx.effects[i];
        if (effect?.cleanup) {
            effect.cleanup();
            effect.cleanup = undefined;
        }
    }
}
export function useMemo(fn, deps) {
    const ctx = getCurrentContext();
    if (!ctx)
        throw new Error('useMemo must be called inside a component');
    const memoIndex = ctx.effectIndex++;
    const cache = ctx.memoCache;
    const cacheKey = `memo_${memoIndex}`;
    const cached = cache.get(cacheKey);
    if (cached && depsEqual(cached.deps, deps)) {
        return cached.value;
    }
    const value = fn();
    cache.set(cacheKey, { deps: [...deps], value });
    return value;
}
export function useCallback(fn, deps) {
    return useMemo(() => fn, deps);
}
let signalId = 0;
const signalStore = new Map();
export function useState(initialValue) {
    const ctx = getCurrentContext();
    if (!ctx)
        throw new Error('useState must be called inside a component');
    const stateIndex = ctx.effectIndex++;
    const id = signalId++;
    let value = initialValue;
    const listeners = new Set();
    signalStore.set(id, {
        get: () => value,
        set: (v) => {
            value = v;
            listeners.forEach((l) => l(value));
        },
    });
    const get = () => signalStore.get(id).get();
    const set = (newValue) => {
        const v = typeof newValue === 'function' ? newValue(value) : newValue;
        signalStore.get(id).set(v);
    };
    return [get, set];
}
function depsEqual(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length; i++) {
        if (!Object.is(a[i], b[i]))
            return false;
    }
    return true;
}
export function createEffect(source, fn) {
    fn(source.get());
    return source.subscribe((v) => fn(v));
}
