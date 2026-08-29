import { createSignal, Signal } from '../state/store.js';
import { VNode } from './renderer.js';

export interface AwaitProps<T> {
  promise: Promise<T> | (() => Promise<T>);
  children: (data: T) => VNode;
  loading?: VNode | (() => VNode);
  error?: (error: Error) => VNode;
}

type AwaitState<T> =
  | { status: 'pending' }
  | { status: 'resolved'; data: T }
  | { status: 'rejected'; error: Error };

interface CacheEntry<T> {
  signal: Signal<AwaitState<T>>;
}

const awaitCache = new WeakMap<Promise<unknown>, CacheEntry<unknown>>();

export function Await<T>(props: AwaitProps<T>): VNode {
  let promise: Promise<T>;
  try {
    promise = typeof props.promise === 'function' ? props.promise() : props.promise;
  } catch (err) {
    const error = err instanceof Error ? err : new Error(String(err));
    if (props.error) return props.error(error);
    return typeof props.loading === 'function' ? props.loading() : (props.loading || { type: 'empty', props: {} });
  }

  const cached = awaitCache.get(promise) as CacheEntry<T> | undefined;

  if (!cached) {
    const signal = createSignal<AwaitState<T>>({ status: 'pending' });
    awaitCache.set(promise, { signal } as CacheEntry<unknown>);

    promise.then(
      (data) => {
        const entry = awaitCache.get(promise) as CacheEntry<T>;
        if (entry) {
          const s = entry.signal.get();
          if (s.status === 'pending') {
            entry.signal.set({ status: 'resolved', data } as AwaitState<T>);
          }
        }
      },
      (err: Error) => {
        const entry = awaitCache.get(promise) as CacheEntry<T>;
        if (entry) {
          const s = entry.signal.get();
          if (s.status === 'pending') {
            entry.signal.set({ status: 'rejected', error: err } as AwaitState<T>);
          }
        }
      }
    );
    return renderAwait(props, { status: 'pending' });
  }

  return renderAwait(props, cached.signal.get());
}

function renderAwait<T>(props: AwaitProps<T>, state: AwaitState<T>): VNode {
  if (state.status === 'resolved') {
    return props.children(state.data);
  }

  if (state.status === 'rejected' && props.error) {
    return props.error(state.error);
  }

  if (typeof props.loading === 'function') {
    return props.loading();
  }
  return props.loading || { type: 'empty', props: {} };
}
