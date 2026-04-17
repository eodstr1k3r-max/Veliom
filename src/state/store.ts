export type Listener<T> = (value: T) => void;

export interface Signal<T> {
  get(): T;
  set(value: T): void;
  update(fn: (value: T) => T): void;
  subscribe(listener: Listener<T>): () => void;
}

export function createSignal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const listeners: Listener<T>[] = [];

  return {
    get(): T {
      return value;
    },
    set(newValue: T): void {
      if (Object.is(value, newValue)) return;
      value = newValue;
      for (let i = 0; i < listeners.length; i++) {
        listeners[i](value);
      }
    },
    update(fn: (value: T) => T): void {
      this.set(fn(value));
    },
    subscribe(listener: Listener<T>): () => void {
      listeners.push(listener);
      return () => {
        const idx = listeners.indexOf(listener);
        if (idx > -1) listeners.splice(idx, 1);
      };
    },
  };
}

export interface Store<T extends object> {
  get<K extends keyof T>(key: K): T[K];
  set<K extends keyof T>(key: K, value: T[K]): void;
  update<K extends keyof T>(key: K, fn: (value: T[K]) => T[K]): void;
  subscribe<K extends keyof T>(key: K, listener: Listener<T[K]>): () => void;
  getState(): Readonly<T>;
}

export function createStore<T extends object>(initialState: T): Store<T> {
  const keys = Object.keys(initialState) as (keyof T)[];
  const signals = new Map<keyof T, Signal<unknown>>();

  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    signals.set(key, createSignal(initialState[key]));
  }

  return {
    get<K extends keyof T>(key: K): T[K] {
      return signals.get(key)?.get() as T[K];
    },
    set<K extends keyof T>(key: K, value: T[K]): void {
      signals.get(key)?.set(value);
    },
    update<K extends keyof T>(key: K, fn: (value: T[K]) => T[K]): void {
      const signal = signals.get(key);
      if (signal) signal.update(fn as (v: unknown) => unknown);
    },
    subscribe<K extends keyof T>(key: K, listener: Listener<T[K]>): () => void {
      return signals.get(key)?.subscribe(listener as Listener<unknown>) ?? (() => {});
    },
    getState(): Readonly<T> {
      const state = {} as T;
      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        (state as Record<keyof T, unknown>)[key] = signals.get(key)?.get();
      }
      return Object.freeze(state);
    },
  };
}

export interface Computed<T> {
  get(): T;
}

export function createComputed<T>(
  compute: () => T,
  dependencies: Signal<unknown>[]
): Computed<T> {
  let value = compute();
  let stale = false;

  const update = () => {
    stale = true;
    const newValue = compute();
    if (!Object.is(value, newValue)) {
      value = newValue;
    }
    stale = false;
  };

  for (let i = 0; i < dependencies.length; i++) {
    dependencies[i].subscribe(update);
  }

  return {
    get(): T {
      return value;
    },
  };
}
