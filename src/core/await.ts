import { createSignal } from '../state/store';
import { VNode } from './renderer';

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

const awaitCache = new WeakMap<Promise<unknown>, { signal: ReturnType<typeof createSignal<AwaitState<unknown>>> }>();

export function Await<T>(props: AwaitProps<T>): VNode {
  const promise = typeof props.promise === 'function' ? props.promise() : props.promise;

  const cached = awaitCache.get(promise as Promise<unknown>) as { signal: { get(): AwaitState<T> } } | undefined;

  if (!cached) {
    const signal = createSignal<AwaitState<T>>({ status: 'pending' });
    awaitCache.set(promise as Promise<unknown>, { signal } as any);

    promise.then(
      (data) => {
        const entry = awaitCache.get(promise as Promise<unknown>) as any;
        if (entry) {
          const s = entry.signal.get() as AwaitState<T>;
          if (s.status === 'pending') {
            entry.signal.set({ status: 'resolved', data } as AwaitState<unknown>);
          }
        }
      },
      (err: Error) => {
        const entry = awaitCache.get(promise as Promise<unknown>) as any;
        if (entry) {
          const s = entry.signal.get() as AwaitState<T>;
          if (s.status === 'pending') {
            entry.signal.set({ status: 'rejected', error: err } as AwaitState<unknown>);
          }
        }
      }
    );
    return renderAwait(props, { status: 'pending' } as AwaitState<T>);
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
