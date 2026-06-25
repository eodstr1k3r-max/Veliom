import { describe, it, expect, vi } from 'vitest';
import { createResource } from '../src/state/resource';
import { createSignal } from '../src/state/store';

describe('createResource', () => {
  it('loads sync fetcher immediately', () => {
    const r = createResource(() => 42);
    expect(r.data()).toBe(42);
    expect(r.loading()).toBe(false);
    expect(r.error()).toBeNull();
  });

  it('handles async fetcher', async () => {
    const r = createResource(() => Promise.resolve('done'));
    expect(r.loading()).toBe(true);
    await vi.dynamicImportSettled();
    await new Promise(r2 => setTimeout(r2, 10));
    expect(r.data()).toBe('done');
    expect(r.loading()).toBe(false);
  });

  it('handles sync error', () => {
    const r = createResource((): any => { throw new Error('fail'); });
    expect(r.error()?.message).toBe('fail');
    expect(r.loading()).toBe(false);
  });

  it('mutate updates data directly', () => {
    const r = createResource(() => 0);
    r.mutate(100);
    expect(r.data()).toBe(100);
  });

  it('refetch re-runs fetcher', async () => {
    let count = 0;
    const r = createResource(() => { count++; return count; });
    expect(r.data()).toBe(1);
    r.refetch();
    expect(r.data()).toBe(2);
  });

  it('tracks source signal changes', () => {
    const s = createSignal(1);
    const fn = vi.fn(() => s.get() * 2);
    const r = createResource(fn, s);
    expect(r.data()).toBe(2);
    s.set(5);
    expect(r.data()).toBe(10);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('returns state via get()', () => {
    const r = createResource(() => 'val');
    const state = r.get();
    expect(state.data).toBe('val');
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });
});
