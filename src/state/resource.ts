import { createSignal, Signal, pushTrackingEffect, popTrackingEffect } from './store';

export interface ResourceState<T> {
  loading: boolean;
  error: Error | null;
  data: T | undefined;
}

export interface Resource<T> {
  get(): ResourceState<T>;
  loading(): boolean;
  error(): Error | null;
  data(): T | undefined;
  mutate(value: T): void;
  refetch(): void;
}

export function createResource<T>(
  fetcher: () => Promise<T> | T,
  source?: Signal<unknown>
): Resource<T> {
  const loading = createSignal(false);
  const error = createSignal<Error | null>(null);
  const data = createSignal<T | undefined>(undefined);
  let pendingPromise: Promise<T> | null = null;
  let disposed = false;

  const load = () => {
    if (disposed) return;
    loading.set(true);
    error.set(null);
    try {
      const result = fetcher();
      if (result instanceof Promise) {
        pendingPromise = result;
        result.then(
          (val) => {
            if (disposed) return;
            if (pendingPromise === result) {
              data.set(val);
              loading.set(false);
            }
          },
          (err) => {
            if (disposed) return;
            if (pendingPromise === result) {
              error.set(err instanceof Error ? err : new Error(String(err)));
              loading.set(false);
            }
          }
        );
      } else {
        data.set(result);
        loading.set(false);
      }
    } catch (err) {
      if (!disposed) {
        error.set(err instanceof Error ? err : new Error(String(err)));
        loading.set(false);
      }
    }
  };

  if (source) {
    const sourceTracker = () => {
      source.get();
      load();
    };
    const runner = () => {
      pushTrackingEffect(runner);
      try {
        sourceTracker();
      } finally {
        popTrackingEffect();
      }
    };
    runner();
  } else {
    load();
  }

  return {
    get(): ResourceState<T> {
      return {
        loading: loading.get(),
        error: error.get(),
        data: data.get(),
      };
    },
    loading: () => loading.get(),
    error: () => error.get(),
    data: () => data.get(),
    mutate(value: T): void {
      data.set(value);
    },
    refetch(): void {
      load();
    },
  };
}
