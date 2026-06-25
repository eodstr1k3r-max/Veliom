import { describe, it, expect } from 'vitest';
import { createAsync } from '../src/state/async';

describe('createAsync', () => {
  it('resolves a sync fetcher immediately', () => {
    const { data, loading, error } = createAsync(() => 42);
    expect(data()).toBe(42);
    expect(loading()).toBe(false);
    expect(error()).toBeUndefined();
  });

  it('resolves a promise fetcher', async () => {
    const { data, loading, error } = createAsync(() => Promise.resolve('hello'));
    expect(loading()).toBe(true);
    expect(data()).toBeUndefined();
    await new Promise(r => setTimeout(r, 0));
    expect(data()).toBe('hello');
    expect(loading()).toBe(false);
    expect(error()).toBeUndefined();
  });

  it('handles errors', async () => {
    const { data, loading, error, refetch } = createAsync(() => Promise.reject(new Error('fail')));
    await new Promise(r => setTimeout(r, 0));
    expect(error()?.message).toBe('fail');
    expect(loading()).toBe(false);
    expect(data()).toBeUndefined();
  });

  it('refetch re-executes', async () => {
    let count = 0;
    const { data, refetch } = createAsync(() => Promise.resolve(++count));
    await new Promise(r => setTimeout(r, 0));
    expect(data()).toBe(1);
    refetch();
    await new Promise(r => setTimeout(r, 0));
    expect(data()).toBe(2);
  });

  it('uses initial value', () => {
    const { data } = createAsync(() => 99, 0);
    expect(data()).toBe(99);
  });
});
