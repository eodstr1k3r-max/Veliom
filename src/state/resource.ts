import { Signal, pushTrackingEffect, popTrackingEffect } from './store';
import { createFetcher } from './async';

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
  dispose(): void;
}

export function createResource<T>(
  fetcher: () => Promise<T> | T,
  source?: Signal<unknown>
): Resource<T> {
  const f = createFetcher(fetcher);
  let unsubSource: (() => void) | null = null;

  const load = f.execute;

  if (source) {
    const runner = () => {
      if (unsubSource) unsubSource();
      pushTrackingEffect(runner);
      try {
        source.get();
        load();
      } finally {
        unsubSource = popTrackingEffect();
      }
    };
    runner();
  } else {
    load();
  }

  return {
    get(): ResourceState<T> {
      return {
        loading: f.loading.get(),
        error: f.error.get() ?? null,
        data: f.data.get(),
      };
    },
    loading: () => f.loading.get(),
    error: () => f.error.get() ?? null,
    data: () => f.data.get(),
    mutate(value: T): void {
      f.data.set(value);
    },
    refetch: load,
    dispose(): void {
      f.dispose();
      if (unsubSource) {
        unsubSource();
        unsubSource = null;
      }
    },
  };
}
