import { describe, it, expect } from 'vitest';
import { createSignal, createStore, createComputed } from '../src/state/store';

describe('Security', () => {
  describe('Signal security', () => {
    it('should not expose internal listeners', () => {
      const signal = createSignal(42);
      
      const listeners = (signal as any)._listeners;
      expect(listeners).toBeUndefined();
      
      const value = (signal as any)._value;
      expect(value).toBeUndefined();
    });

    it('should properly isolate signals', () => {
      const sig1 = createSignal(1);
      const sig2 = createSignal(2);
      
      sig1.set(10);
      expect(sig1.get()).toBe(10);
      expect(sig2.get()).toBe(2);
    });
  });

  describe('Store security', () => {
    it('should not expose internal signals', () => {
      const store = createStore({ count: 0 });
      
      expect((store as any).signals).toBeUndefined();
      expect((store as any)._signals).toBeUndefined();
    });

    it('should properly isolate store values', () => {
      const store1 = createStore({ value: 'a' });
      const store2 = createStore({ value: 'b' });
      
      store1.set('value', 'changed');
      expect(store1.get('value')).toBe('changed');
      expect(store2.get('value')).toBe('b');
    });
  });

  describe('Computed security', () => {
    it('should not expose internal dependencies', () => {
      const sig = createSignal(1);
      const computed = createComputed(() => sig.get() * 2, [sig]);
      
      expect((computed as any).dependencies).toBeUndefined();
      expect((computed as any)._deps).toBeUndefined();
    });
  });

  describe('Object.freeze on getState', () => {
    it('should freeze returned state', () => {
      const store = createStore({ count: 0 });
      const state = store.getState();
      
      expect(() => {
        (state as any).count = 999;
      }).toThrow();
    });

    it('should return new frozen object each time', () => {
      const store = createStore({ count: 0 });
      const state1 = store.getState();
      const state2 = store.getState();
      
      expect(state1).not.toBe(state2);
    });
  });
});
