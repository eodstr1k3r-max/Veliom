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

const awaitCache = new WeakMap<Promise<unknown>, AwaitState<unknown>>();

export function Await<T>(props: AwaitProps<T>): VNode {
  const promise = typeof props.promise === 'function' ? props.promise() : props.promise;

  let state = awaitCache.get(promise as Promise<unknown>) as AwaitState<T> | undefined;

  if (!state) {
    state = { status: 'pending' };
    awaitCache.set(promise as Promise<unknown>, state as AwaitState<unknown>);

    promise.then(
      (data) => {
        const s = awaitCache.get(promise as Promise<unknown>) as AwaitState<unknown>;
        if (s && s.status === 'pending') {
          awaitCache.set(promise as Promise<unknown>, { status: 'resolved', data } as AwaitState<unknown>);
        }
      },
      (err: Error) => {
        const s = awaitCache.get(promise as Promise<unknown>) as AwaitState<unknown>;
        if (s && s.status === 'pending') {
          awaitCache.set(promise as Promise<unknown>, { status: 'rejected', error: err } as AwaitState<unknown>);
        }
      }
    );
  }

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
