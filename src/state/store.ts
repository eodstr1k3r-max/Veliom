export type Listener<T> = (value: T) => void;

export interface Signal<T> {
  get(): T;
  set(value: T): void;
  update(fn: (value: T) => T): void;
  subscribe(listener: Listener<T>): () => void;
}

const trackingStack: (() => void)[] = [];
let batchDepth = 0;
const pendingEffects = new Set<() => void>();

export function pushTrackingEffect(fn: () => void): void {
  trackingStack.push(fn);
}

export function popTrackingEffect(): void {
  trackingStack.pop();
}

export function getTrackingEffect(): (() => void) | null {
  return trackingStack[trackingStack.length - 1] || null;
}

export function batch(fn: () => void): void {
  batchDepth++;
  try {
    fn();
  } finally {
    batchDepth--;
    if (batchDepth === 0) {
      const effects = [...pendingEffects];
      pendingEffects.clear();
      for (let i = 0; i < effects.length; i++) {
        effects[i]();
      }
    }
  }
}

export function createSignal<T>(initialValue: T): Signal<T> {
  let value = initialValue;
  const listeners = new Set<Listener<T>>();
  const notifyingListeners = new WeakSet<Listener<T>>();

  return {
    get(): T {
      const effect = getTrackingEffect();
      if (effect) {
        listeners.add(effect as unknown as Listener<T>);
      }
      return value;
    },
    set(newValue: T): void {
      if (Object.is(value, newValue)) return;
      value = newValue;
      if (batchDepth > 0) {
        for (const listener of listeners) {
          pendingEffects.add(listener as unknown as () => void);
        }
      } else {
        const currentListeners = [...listeners];
        for (let i = 0; i < currentListeners.length; i++) {
          const listener = currentListeners[i];
          if (notifyingListeners.has(listener)) continue;
          notifyingListeners.add(listener);
          listener(value);
          notifyingListeners.delete(listener);
        }
      }
    },
    update(fn: (value: T) => T): void {
      this.set(fn(value));
    },
    subscribe(listener: Listener<T>): () => void {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
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
  dependencies?: Signal<unknown>[]
): Computed<T> {
  let value: T;
  const depSignals = dependencies ?? [];
  let initialized = false;

  const run = () => {
    const newValue = compute();
    if (!initialized || !Object.is(value, newValue)) {
      value = newValue;
      initialized = true;
    }
  };

  if (depSignals.length > 0) {
    const runner = () => {
      pushTrackingEffect(runner);
      try {
        run();
      } finally {
        popTrackingEffect();
      }
    };

    for (let i = 0; i < depSignals.length; i++) {
      depSignals[i].subscribe(runner);
    }
    value = compute();
    initialized = true;
  } else {
    const runner = () => {
      pushTrackingEffect(runner);
      try {
        run();
      } finally {
        popTrackingEffect();
      }
    };
    runner();
  }

  return {
    get(): T {
      return value;
    },
  };
}

export function createDeepStore<T extends Record<string, unknown>>(initial: T): {
  state: T;
  subscribe: (fn: () => void) => () => void;
} {
  const signal = createSignal(initial);
  const subs = new Set<() => void>();

  const handler: ProxyHandler<T> = {
    get(target: T, prop: string | symbol) {
      const val = target[prop as keyof T];
      signal.get();
      if (val && typeof val === 'object' && !Array.isArray(val)) {
        return new Proxy(val as any, handler);
      }
      return val;
    },
    set(target: T, prop: string | symbol, value: unknown) {
      target[prop as keyof T] = value as any;
      signal.set({ ...target });
      for (const fn of subs) fn();
      return true;
    },
  };

  const proxy = new Proxy(initial, handler) as T;

  return {
    state: proxy,
    subscribe(fn: () => void) {
      subs.add(fn);
      return () => subs.delete(fn);
    },
  };
}

export function combineSignals<T>(sources: Signal<unknown>[], compute: () => T): Signal<T> {
  const signal = createSignal<T>(undefined as unknown as T);
  const update = () => { signal.set(compute()); };
  const runner = () => {
    pushTrackingEffect(runner);
    try {
      update();
    } finally {
      popTrackingEffect();
    }
  };
  runner();
  return signal;
}

export function createMediaQuery(query: string): Signal<boolean> {
  const mql = typeof window !== 'undefined' ? window.matchMedia(query) : null;
  const signal = createSignal(mql?.matches ?? false);
  if (mql) {
    const handler = (e: MediaQueryListEvent) => signal.set(e.matches);
    mql.addEventListener('change', handler);
  }
  return signal;
}

export type Memo<T> = Computed<T>;

export function createMemo<T>(compute: () => T): Memo<T> {
  const signal = createSignal<T>(undefined as unknown as T);

  const run = () => {
    const newValue = compute();
    signal.set(newValue);
  };

  const tracker = () => {
    pushTrackingEffect(tracker);
    try {
      run();
    } finally {
      popTrackingEffect();
    }
  };
  tracker();

  return {
    get(): T {
      return signal.get();
    },
  };
}
