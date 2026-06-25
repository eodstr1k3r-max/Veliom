import { describe, it, expect, vi } from 'vitest';
import { onClickOutside } from '../src/utils/events';

describe('onClickOutside', () => {
  it('returns a cleanup function when element exists', () => {
    const el = document.createElement('div');
    const cleanup = onClickOutside(el, vi.fn());
    expect(typeof cleanup).toBe('function');
    cleanup();
  });

  it('returns noop when element is null', () => {
    const cleanup = onClickOutside(null, vi.fn());
    cleanup();
  });

  it('returns noop when disabled', () => {
    const el = document.createElement('div');
    const cleanup = onClickOutside(el, vi.fn(), false);
    cleanup();
  });

  it('calls callback when clicking outside', () => {
    const fn = vi.fn();
    const outside = document.createElement('div');
    document.body.appendChild(outside);
    const el = document.createElement('div');
    document.body.appendChild(el);
    const cleanup = onClickOutside(el, fn, true);
    outside.click();
    expect(fn).toHaveBeenCalledTimes(1);
    cleanup();
    document.body.removeChild(el);
    document.body.removeChild(outside);
  });
});
