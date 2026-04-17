import { describe, it, expect } from 'vitest';
import { createSignal, createStore, createComputed } from '../src/state/store';

describe('Signal', () => {
  it('should create a signal with initial value', () => {
    const count = createSignal(0);
    expect(count.get()).toBe(0);
  });

  it('should set a new value', () => {
    const count = createSignal(0);
    count.set(5);
    expect(count.get()).toBe(5);
  });

  it('should update value using a function', () => {
    const count = createSignal(0);
    count.update(n => n + 1);
    expect(count.get()).toBe(1);
  });

  it('should not notify subscribers when value is the same', () => {
    const count = createSignal(5);
    const subscriber = vi.fn();
    count.subscribe(subscriber);
    count.set(5);
    expect(subscriber).not.toHaveBeenCalled();
  });

  it('should notify subscribers on value change', () => {
    const count = createSignal(0);
    const subscriber = vi.fn();
    count.subscribe(subscriber);
    count.set(10);
    expect(subscriber).toHaveBeenCalledWith(10);
  });

  it('should allow unsubscribing', () => {
    const count = createSignal(0);
    const subscriber = vi.fn();
    const unsubscribe = count.subscribe(subscriber);
    unsubscribe();
    count.set(5);
    expect(subscriber).not.toHaveBeenCalled();
  });
});

describe('Store', () => {
  it('should create a store with initial state', () => {
    const store = createStore({ name: 'Veliom', count: 0 });
    expect(store.get('name')).toBe('Veliom');
    expect(store.get('count')).toBe(0);
  });

  it('should set values', () => {
    const store = createStore({ name: 'Veliom' });
    store.set('name', 'Vue');
    expect(store.get('name')).toBe('Vue');
  });

  it('should update values using a function', () => {
    const store = createStore({ count: 0 });
    store.update('count', n => n + 1);
    expect(store.get('count')).toBe(1);
  });

  it('should subscribe to specific keys', () => {
    const store = createStore({ name: 'Veliom', count: 0 });
    const subscriber = vi.fn();
    store.subscribe('count', subscriber);
    store.set('count', 5);
    expect(subscriber).toHaveBeenCalledWith(5);
    store.set('name', 'Changed');
    expect(subscriber).not.toHaveBeenCalledTimes(2);
  });

  it('should get full state', () => {
    const store = createStore({ name: 'Veliom', count: 0 });
    const state = store.getState();
    expect(state).toEqual({ name: 'Veliom', count: 0 });
  });
});

describe('Computed', () => {
  it('should compute derived values', () => {
    const a = createSignal(2);
    const b = createSignal(3);
    const sum = createComputed(() => a.get() + b.get(), [a, b]);
    expect(sum.get()).toBe(5);
  });

  it('should update when dependencies change', () => {
    const count = createSignal(0);
    const doubled = createComputed(() => count.get() * 2, [count]);
    expect(doubled.get()).toBe(0);
    count.set(5);
    expect(doubled.get()).toBe(10);
  });
});
