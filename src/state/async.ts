import { createSignal } from './store';

export interface AsyncState<T> {
  data: () => T | undefined;
  loading: () => boolean;
  error: () => Error | undefined;
  refetch: () => void;
}

export function createAsync<T>(
  fetcher: () => Promise<T> | T,
  initial?: T
): AsyncState<T> {
  const data = createSignal<T | undefined>(initial);
  const loading = createSignal(true);
  const error = createSignal<Error | undefined>(undefined);

  const execute = () => {
    loading.set(true);
    error.set(undefined);
    try {
      const result = fetcher();
      if (result instanceof Promise) {
        result
          .then((val) => { data.set(val); loading.set(false); })
          .catch((err) => { error.set(err instanceof Error ? err : new Error(String(err))); loading.set(false); });
      } else {
        data.set(result);
        loading.set(false);
      }
    } catch (err) {
      error.set(err instanceof Error ? err : new Error(String(err)));
      loading.set(false);
    }
  };

  execute();
  return { data: () => data.get(), loading: () => loading.get(), error: () => error.get(), refetch: execute };
}
