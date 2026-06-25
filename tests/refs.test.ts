import { describe, it, expect, vi } from 'vitest';
import { createRef, mergeRefs } from '../src/core/refs';

describe('createRef', () => {
  it('creates a ref object with null current', () => {
    const ref = createRef();
    expect(ref).toHaveProperty('current');
    expect(ref.current).toBeNull();
  });

  it('returns a new object each call', () => {
    const a = createRef();
    const b = createRef();
    expect(a).not.toBe(b);
  });

  it('allows setting current', () => {
    const ref = createRef();
    const el = document.createElement('div');
    ref.current = el;
    expect(ref.current).toBe(el);
  });
});

describe('mergeRefs', () => {
  it('calls all callback refs', () => {
    const a = vi.fn();
    const b = vi.fn();
    const merged = mergeRefs(a, b);
    const el = document.createElement('div');
    merged(el);
    expect(a).toHaveBeenCalledWith(el);
    expect(b).toHaveBeenCalledWith(el);
  });

  it('sets current on object refs', () => {
    const refA = createRef();
    const fnB = vi.fn();
    const merged = mergeRefs(refA, fnB);
    const el = document.createElement('span');
    merged(el);
    expect(refA.current).toBe(el);
    expect(fnB).toHaveBeenCalledWith(el);
  });

  it('calls with null on cleanup', () => {
    const fn = vi.fn();
    const merged = mergeRefs(fn);
    merged(null);
    expect(fn).toHaveBeenCalledWith(null);
  });

  it('handles mixed refs and empty refs', () => {
    const ref = createRef();
    const merged = mergeRefs(ref);
    const el = document.createElement('div');
    merged(el);
    expect(ref.current).toBe(el);
  });
});
