import { describe, it, expect, vi } from 'vitest';
import {
  pushLifecycleContext,
  popLifecycleContext,
  getCurrentLifecycle,
  onMount,
  onUpdate,
  onUnmount,
  triggerOnMount,
} from '../src/state/lifecycle';

function withLifecycle<T>(fn: () => T): T {
  pushLifecycleContext();
  try {
    return fn();
  } finally {
    popLifecycleContext();
  }
}

describe('onMount', () => {
  it('registers a mount hook', () => {
    const fn = vi.fn();
    withLifecycle(() => {
      onMount(fn);
    });
    const ctx = getCurrentLifecycle();
    expect(ctx).toBeUndefined();
  });

  it('executes mount hook via triggerOnMount', () => {
    const fn = vi.fn();
    const ctx = pushLifecycleContext();
    onMount(fn);
    popLifecycleContext();
    triggerOnMount(ctx);
    expect(fn).toHaveBeenCalled();
  });

  it('chains multiple onMount calls', () => {
    const calls: string[] = [];
    const ctx = pushLifecycleContext();
    onMount(() => { calls.push('a'); });
    onMount(() => { calls.push('b'); });
    popLifecycleContext();
    triggerOnMount(ctx);
    expect(calls).toEqual(['a', 'b']);
  });

  it('registers cleanup from mount return', () => {
    const cleanup = vi.fn();
    const ctx = pushLifecycleContext();
    onMount(() => cleanup);
    popLifecycleContext();
    triggerOnMount(ctx);
    expect(cleanup).not.toHaveBeenCalled();
    ctx.onUnmount!();
    expect(cleanup).toHaveBeenCalled();
  });
});

describe('onUpdate', () => {
  it('registers an update hook', () => {
    const fn = vi.fn();
    const ctx = pushLifecycleContext();
    onUpdate(fn);
    popLifecycleContext();
    ctx.onUpdate!({} as any);
    expect(fn).toHaveBeenCalled();
  });

  it('passes prevProps to update hook', () => {
    const fn = vi.fn();
    const ctx = pushLifecycleContext();
    onUpdate(fn);
    popLifecycleContext();
    const prev = { val: 'old' };
    ctx.onUpdate!(prev);
    expect(fn).toHaveBeenCalledWith(prev);
  });
});

describe('onUnmount', () => {
  it('registers an unmount hook', () => {
    const fn = vi.fn();
    const ctx = pushLifecycleContext();
    onUnmount(fn);
    popLifecycleContext();
    ctx.onUnmount!();
    expect(fn).toHaveBeenCalled();
  });

  it('chains multiple unmount hooks', () => {
    const a = vi.fn();
    const b = vi.fn();
    const ctx = pushLifecycleContext();
    onUnmount(a);
    onUnmount(b);
    popLifecycleContext();
    ctx.onUnmount!();
    expect(a).toHaveBeenCalled();
    expect(b).toHaveBeenCalled();
  });
});

describe('pushLifecycleContext / popLifecycleContext', () => {
  it('returns undefined outside lifecycle context', () => {
    expect(getCurrentLifecycle()).toBeUndefined();
  });

  it('maintains stack correctly', () => {
    const a = pushLifecycleContext();
    const b = pushLifecycleContext();
    expect(getCurrentLifecycle()).toBe(b);
    popLifecycleContext();
    expect(getCurrentLifecycle()).toBe(a);
    popLifecycleContext();
    expect(getCurrentLifecycle()).toBeUndefined();
  });
});
