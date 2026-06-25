import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import { createRouter, Route, Link, useRouter } from '../src/core/router';
import { h } from '../src/core/renderer';

describe('createRouter', () => {
  beforeAll(() => {
    window.location.hash = '#/home';
    window.dispatchEvent(new Event('hashchange'));
  });

  it('creates a router with hash mode', () => {
    const router = createRouter([
      { path: '/home', component: () => h('div', null, 'Home') },
    ]);
    expect(router.currentPath.get()).toBe('/home');
    router.dispose();
  });

  it('navigate updates current path', () => {
    const router = createRouter([]);
    const orig = window.location.hash;
    router.navigate('/test');
    expect(window.location.hash).toBe('#/test');
    router.dispose();
    window.location.hash = orig;
  });

  it('resolve returns hash path', () => {
    const router = createRouter([]);
    expect(router.resolve('/about')).toBe('#/about');
    router.dispose();
  });
});

describe('Route', () => {
  it('renders component when path matches', () => {
    const router = createRouter([]);
    const vnode = Route({ path: '/home', component: () => h('span', null, 'match'), router });
    expect(vnode.type).toBe('span');
    router.dispose();
  });

  it('renders fallback when path does not match', () => {
    const router = createRouter([]);
    const vnode = Route({ path: '/other', component: () => h('span'), router, fallback: h('div', null, 'fallback') });
    expect(vnode.type).toBe('div');
    router.dispose();
  });
});

describe('useRouter', () => {
  it('returns path and navigate', () => {
    const router = createRouter([]);
    const r = useRouter(router);
    expect(typeof r.path).toBe('function');
    expect(typeof r.navigate).toBe('function');
    expect(typeof r.params).toBe('function');
    router.dispose();
  });
});
