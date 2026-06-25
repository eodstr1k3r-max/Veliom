import { describe, it, expect, vi } from 'vitest';
import { Suspense, createSuspense } from '../src/core/suspense';
import { lazy } from '../src/core/lazy';
import { h } from '../src/core/renderer';

describe('Suspense', () => {
  it('returns fallback when lazy component is not loaded', () => {
    const loader = () => Promise.resolve({ default: { render: () => h('div') } });
    const comp = lazy(loader);
    const vnode = Suspense({ children: comp, fallback: h('p', null, 'loading...') });
    expect(vnode.type).toBe('p');
  });

  it('returns rendered lazy component when loaded', async () => {
    const loader = () => Promise.resolve({ default: { render: () => h('section', null, 'done') } });
    const comp = lazy(loader);
    await comp.load();
    const vnode = Suspense({ children: comp, fallback: h('p') });
    expect(vnode.type).toBe('section');
  });

  it('renders a render function directly', () => {
    const renderFn = () => h('button', null, 'click');
    const vnode = Suspense({ children: renderFn });
    expect(vnode.type).toBe('button');
  });
});

describe('createSuspense', () => {
  it('creates a suspension with fixed fallback', () => {
    const fallback = h('div', null, 'wait');
    const { Suspense: S } = createSuspense(fallback);
    const loader = () => Promise.resolve({ default: { render: () => h('span') } });
    const comp = lazy(loader);
    const vnode = S({ children: comp });
    expect(vnode.type).toBe('div');
  });

  it('preload triggers load', () => {
    const { preload: pl } = createSuspense(h('div'));
    const loadFn = vi.fn(() => Promise.resolve({ default: { render: () => h('span') } }));
    const comp = lazy(loadFn);
    pl(comp);
    expect(loadFn).toHaveBeenCalled();
  });
});
