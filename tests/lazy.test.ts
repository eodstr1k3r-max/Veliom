import { describe, it, expect, vi } from 'vitest';
import { lazy, preload } from '../src/core/lazy';
import { h } from '../src/core/renderer';

describe('lazy', () => {
  it('returns a LazyComponent with load method', () => {
    const loader = () => Promise.resolve({ default: { render: () => h('div') } });
    const comp = lazy(loader);
    expect(typeof comp.load).toBe('function');
    expect(comp.loaded).toBe(false);
    expect(comp.error).toBeNull();
  });

  it('loads the component and updates state', async () => {
    const loader = () => Promise.resolve({ default: { render: () => h('div') } });
    const comp = lazy(loader);
    await comp.load();
    expect(comp.loaded).toBe(true);
  });

  it('returns fallback before loading', () => {
    const loader = () => Promise.resolve({ default: { render: () => h('div') } });
    const comp = lazy(loader, { fallback: h('span', null, 'loading') });
    const vnode = comp.render({});
    expect(vnode.type).toBe('span');
  });

  it('renders loaded component after load', async () => {
    const loader = () => Promise.resolve({ default: { render: () => h('main', null, 'loaded') } });
    const comp = lazy(loader);
    await comp.load();
    const vnode = comp.render({});
    expect(vnode.type).toBe('main');
  });

  it('rejects on load error', async () => {
    const loader = () => Promise.reject(new Error('fail'));
    const comp = lazy(loader);
    await expect(comp.load()).rejects.toThrow('fail');
    expect(comp.error).toBeTruthy();
  });

  it('does not call loader multiple times', async () => {
    const fn = vi.fn(() => Promise.resolve({ default: { render: () => h('div') } }));
    const comp = lazy(fn);
    await Promise.all([comp.load(), comp.load(), comp.load()]);
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('preload', () => {
  it('calls load on the component', async () => {
    const loader = () => Promise.resolve({ default: { render: () => h('div') } });
    const comp = lazy(loader);
    const result = await preload(comp);
    expect(result.default).toBeDefined();
  });
});
