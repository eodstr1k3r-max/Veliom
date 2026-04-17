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
  memoCache: Map<string, { deps: unknown[]; value: unknown }>;
  effectIndex: number;
}

const contextStack: Context[] = [];

export function pushComponentContext(): Context {
  const ctx: Context = { effects: [], memoCache: new Map(), effectIndex: 0 };
  contextStack.push(ctx);
  return ctx;
}

export function popComponentContext(): void {
  contextStack.pop();
}

export function getCurrentContext(): Context | undefined {
  return contextStack[contextStack.length - 1];
}

export function useEffect(fn: EffectFn, deps: unknown[] = []): void {
  const ctx = getCurrentContext();
  if (!ctx) throw new Error('useEffect must be called inside a component');

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

export function runEffects(): void {
  const ctx = getCurrentContext();
  if (!ctx) return;

  for (let i = 0; i < ctx.effects.length; i++) {
    const effect = ctx.effects[i];
    if (!effect) continue;

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

export function cleanupEffects(): void {
  const ctx = getCurrentContext();
  if (!ctx) return;

  for (let i = 0; i < ctx.effects.length; i++) {
    const effect = ctx.effects[i];
    if (effect?.cleanup) {
      effect.cleanup();
      effect.cleanup = undefined;
    }
  }
}

export function useMemo<T>(fn: () => T, deps: unknown[]): T {
  const ctx = getCurrentContext();
  if (!ctx) throw new Error('useMemo must be called inside a component');

  const memoIndex = ctx.effectIndex++;
  const cache = ctx.memoCache;
  const cacheKey = `memo_${memoIndex}`;
  const cached = cache.get(cacheKey);

  if (cached && depsEqual(cached.deps, deps)) {
    return cached.value as T;
  }

  const value = fn();
  cache.set(cacheKey, { deps: [...deps], value });
  return value;
}

export function useCallback<T extends (...args: unknown[]) => unknown>(
  fn: T,
  deps: unknown[]
): T {
  return useMemo(() => fn, deps);
}

let signalId = 0;
const signalStore = new Map<number, { get: () => unknown; set: (v: unknown) => void }>();

export function useState<T>(
  initialValue: T
): [() => T, (value: T | ((prev: T) => T)) => void] {
  const ctx = getCurrentContext();
  if (!ctx) throw new Error('useState must be called inside a component');

  const stateIndex = ctx.effectIndex++;
  const id = signalId++;
  let value = initialValue;
  const listeners: Set<(v: T) => void> = new Set();

  signalStore.set(id, {
    get: () => value,
    set: (v: unknown) => {
      value = v as T;
      listeners.forEach((l) => l(value));
    },
  });

  const get = () => signalStore.get(id)!.get() as T;
  const set = (newValue: T | ((prev: T) => T)) => {
    const v = typeof newValue === 'function' ? (newValue as (prev: T) => T)(value) : newValue;
    signalStore.get(id)!.set(v);
  };

  return [get, set];
}

function depsEqual(a: unknown[], b: unknown[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

export function createEffect<T>(
  source: Signal<unknown>,
  fn: (value: T) => void
): () => void {
  fn(source.get() as T);
  return source.subscribe((v: unknown) => fn(v as T));
}
