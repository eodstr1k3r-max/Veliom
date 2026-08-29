import { createSignal } from './store.js';

export interface AsyncState<T> {
  data: () => T | undefined;
  loading: () => boolean;
  error: () => Error | undefined;
  refetch: () => void;
  dispose: () => void;
}

export function createFetcher<T>(
  fetcher: () => Promise<T> | T,
  initial?: T
): {
  data: ReturnType<typeof createSignal<T | undefined>>;
  loading: ReturnType<typeof createSignal<boolean>>;
  error: ReturnType<typeof createSignal<Error | undefined>>;
  dispose: () => void;
  execute: () => void;
} {
  const data = createSignal<T | undefined>(initial);
  const loading = createSignal(true);
  const error = createSignal<Error | undefined>(undefined);
  let disposed = false;
  let pendingPromise: Promise<T> | null = null;

  const execute = () => {
    if (disposed) return;
    loading.set(true);
    error.set(undefined);
    try {
      const result = fetcher();
      if (result instanceof Promise) {
        pendingPromise = result;
        result
          .then((val) => { if (!disposed && pendingPromise === result) { data.set(val); loading.set(false); } })
          .catch((err) => { if (!disposed && pendingPromise === result) { error.set(err instanceof Error ? err : new Error(String(err))); loading.set(false); } });
      } else {
        if (!disposed) { data.set(result); loading.set(false); }
      }
    } catch (err) {
      if (!disposed) { error.set(err instanceof Error ? err : new Error(String(err))); loading.set(false); }
    }
  };

  return {
    data, loading, error,
    dispose: () => { disposed = true; },
    execute,
  };
}

export function createAsync<T>(
  fetcher: () => Promise<T> | T,
  initial?: T
): AsyncState<T> {
  const f = createFetcher(fetcher, initial);

  f.execute();

  return {
    data: () => f.data.get(),
    loading: () => f.loading.get(),
    error: () => f.error.get(),
    refetch: f.execute,
    dispose: f.dispose,
  };
}
