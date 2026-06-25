import { describe, it, expect, vi } from 'vitest';
import { createSignal, createStore, createDeepStore, createComputed, createMemo, combineSignals, createMediaQuery, batch } from '../src/state/store';

describe('createSignal', () => {
  it('creates a signal with initial value', () => {
    const s = createSignal(42);
    expect(s.get()).toBe(42);
  });

  it('updates value with set()', () => {
    const s = createSignal(0);
    s.set(10);
    expect(s.get()).toBe(10);
  });

  it('updates value with update()', () => {
    const s = createSignal(5);
    s.update(v => v * 2);
    expect(s.get()).toBe(10);
  });

  it('does not trigger listener when value is same (Object.is)', () => {
    const s = createSignal(NaN);
    const listener = vi.fn();
    s.subscribe(listener);
    s.set(NaN);
    expect(listener).not.toHaveBeenCalled();
  });

  it('notifies subscribers on change', () => {
    const s = createSignal('hello');
    const listener = vi.fn();
    s.subscribe(listener);
    s.set('world');
    expect(listener).toHaveBeenCalledWith('world');
  });

  it('unsubscribes cleanly', () => {
    const s = createSignal(0);
    const listener = vi.fn();
    const unsub = s.subscribe(listener);
    unsub();
    s.set(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it('supports multiple subscribers', () => {
    const s = createSignal(0);
    const a = vi.fn();
    const b = vi.fn();
    s.subscribe(a);
    s.subscribe(b);
    s.set(1);
    expect(a).toHaveBeenCalledWith(1);
    expect(b).toHaveBeenCalledWith(1);
  });

  it('prevents recursive re-trigger', () => {
    const s = createSignal(42);
    let callCount = 0;
    s.subscribe(() => {
      callCount++;
      s.set(42);
    });
    s.set(100);
    expect(callCount).toBe(1);
  });

  it('snapshots listeners to handle unsubscribe during notify', () => {
    const s = createSignal(0);
    let unsub: (() => void) | null = null;
    const calls: number[] = [];
    unsub = s.subscribe((v) => {
      calls.push(v);
      if (v === 1 && unsub) unsub();
    });
    s.set(1);
    s.set(2);
    expect(calls).toEqual([1]);
  });

  it('does not expose internal properties', () => {
    const s = createSignal(42);
    expect((s as any)._value).toBeUndefined();
    expect((s as any)._listeners).toBeUndefined();
  });
});

describe('createStore', () => {
  it('creates a store with initial state', () => {
    const store = createStore({ count: 0, name: 'test' });
    expect(store.get('count')).toBe(0);
    expect(store.get('name')).toBe('test');
  });

  it('updates values with set()', () => {
    const store = createStore({ count: 0 });
    store.set('count', 5);
    expect(store.get('count')).toBe(5);
  });

  it('updates values with update()', () => {
    const store = createStore({ count: 0 });
    store.update('count', v => v + 1);
    expect(store.get('count')).toBe(1);
  });

  it('returns frozen state from getState()', () => {
    const store = createStore({ x: 1 });
    const state = store.getState();
    expect(Object.isFrozen(state)).toBe(true);
  });

  it('returns a new snapshot each getState() call', () => {
    const store = createStore({ x: 1 });
    expect(store.getState()).not.toBe(store.getState());
  });

  it('isolates two stores completely', () => {
    const a = createStore({ val: 'a' });
    const b = createStore({ val: 'b' });
    a.set('val', 'changed');
    expect(a.get('val')).toBe('changed');
    expect(b.get('val')).toBe('b');
  });

  it('subscribes to key changes', () => {
    const store = createStore({ count: 0 });
    const listener = vi.fn();
    store.subscribe('count', listener);
    store.set('count', 10);
    expect(listener).toHaveBeenCalledWith(10);
  });

  it('does not expose internal signals map', () => {
    const store = createStore({ x: 1 });
    expect((store as any).signals).toBeUndefined();
  });
});

describe('createComputed', () => {
  it('computes derived value from signal', () => {
    const s = createSignal(5);
    const c = createComputed(() => s.get() * 2, [s]);
    expect(c.get()).toBe(10);
  });

  it('updates when signal changes', () => {
    const s = createSignal(5);
    const c = createComputed(() => s.get() * 2, [s]);
    s.set(10);
    expect(c.get()).toBe(20);
  });

  it('works without explicit deps (auto-track)', () => {
    const s = createSignal(3);
    const c = createComputed(() => s.get() + 1);
    expect(c.get()).toBe(4);
    s.set(10);
    expect(c.get()).toBe(11);
  });

  it('does not expose internal deps', () => {
    const s = createSignal(1);
    const c = createComputed(() => s.get() * 2, [s]);
    expect((c as any)._deps).toBeUndefined();
    expect((c as any).dependencies).toBeUndefined();
  });
});

describe('createMemo', () => {
  it('eagerly evaluates and caches value', () => {
    const s = createSignal(5);
    const fn = vi.fn(() => s.get() * 2);
    const m = createMemo(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    expect(m.get()).toBe(10);
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('re-evaluates when signal changes', () => {
    const s = createSignal(5);
    const m = createMemo(() => s.get() * 2);
    expect(m.get()).toBe(10);
    s.set(10);
    expect(m.get()).toBe(20);
  });

  it('tracks dependencies automatically', () => {
    const a = createSignal(1);
    const b = createSignal(2);
    const m = createMemo(() => a.get() + b.get());
    expect(m.get()).toBe(3);
    a.set(5);
    expect(m.get()).toBe(7);
    b.set(10);
    expect(m.get()).toBe(15);
  });

  it('can be used inside createComputed for chaining', () => {
    const s = createSignal(3);
    const m = createMemo(() => s.get() * 2);
    const c = createComputed(() => m.get() + 1, []);
    expect(c.get()).toBe(7);
    s.set(5);
    expect(c.get()).toBe(11);
  });
});

describe('combineSignals', () => {
  it('combines multiple signals into one derived signal', () => {
    const a = createSignal(1);
    const b = createSignal(2);
    const combined = combineSignals([a, b], () => a.get() + b.get());
    expect(combined.get()).toBe(3);
    a.set(5);
    expect(combined.get()).toBe(7);
    b.set(10);
    expect(combined.get()).toBe(15);
  });
});

describe('createDeepStore', () => {
  it('creates a proxy store with nested access', () => {
    const ds = createDeepStore({ user: { name: 'Alice', age: 30 } });
    expect(ds.state.user.name).toBe('Alice');
    expect(ds.state.user.age).toBe(30);
  });

  it('triggers subscribe on mutation', () => {
    const fn = vi.fn();
    const ds = createDeepStore({ count: 0 });
    ds.subscribe(fn);
    ds.state.count = 1;
    expect(fn).toHaveBeenCalledTimes(1);
    expect(ds.state.count).toBe(1);
  });
});

describe('createMediaQuery', () => {
  it('returns a signal', () => {
    const origMatchMedia = window.matchMedia;
    window.matchMedia = (() => ({ matches: true, addEventListener: () => {} })) as any;
    const mq = createMediaQuery('(min-width: 0px)');
    expect(typeof mq.get).toBe('function');
    expect(typeof mq.set).toBe('function');
    window.matchMedia = origMatchMedia;
  });
});

describe('batch()', () => {
  it('batches signal updates', () => {
    const s = createSignal(0);
    const fn = vi.fn();
    s.subscribe(fn);
    batch(() => {
      s.set(1);
      s.set(2);
      s.set(3);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(s.get()).toBe(3);
  });

  it('works with nested batch calls', () => {
    const s = createSignal(0);
    const fn = vi.fn();
    s.subscribe(fn);
    batch(() => {
      s.set(1);
      batch(() => {
        s.set(2);
      });
      s.set(3);
    });
    expect(fn).toHaveBeenCalledTimes(1);
    expect(s.get()).toBe(3);
  });
});
