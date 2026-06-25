import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Await } from '../src/core/await';
import { h, render } from '../src/core/renderer';

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  if (container.parentNode) document.body.removeChild(container);
});

describe('Await', () => {
  it('shows loading state initially', () => {
    const promise = new Promise<string>(() => {});
    const vnode = Await({
      promise,
      children: (data: string) => h('span', null, data),
      loading: h('p', null, 'loading...'),
    });
    expect(vnode.type).toBe('p');
    expect(vnode.children![0].props.value).toBe('loading...');
  });

  it('shows loading via function', () => {
    const promise = new Promise<string>(() => {});
    const vnode = Await({
      promise,
      children: (data: string) => h('span'),
      loading: () => h('div', null, 'spinner'),
    });
    expect(vnode.type).toBe('div');
  });

  it('shows empty when no loading provided', () => {
    const promise = new Promise<string>(() => {});
    const vnode = Await({
      promise,
      children: (data: string) => h('span'),
    });
    expect(vnode.type).toBe('empty');
  });

  it('shows resolved data', async () => {
    const promise = Promise.resolve('hello');
    const vnode = Await({
      promise,
      children: (data: string) => h('span', null, data),
      loading: h('p'),
    });
    await Promise.resolve();
    const vnode2 = Await({
      promise,
      children: (data: string) => h('span', null, data),
      loading: h('p'),
    });
    expect(vnode2.type).toBe('span');
    expect(vnode2.children![0].props.value).toBe('hello');
  });

  it('shows error state on rejection', async () => {
    const promise = Promise.reject(new Error('fail'));
    const vnode = Await({
      promise,
      children: (data: string) => h('span'),
      error: (err) => h('p', null, err.message),
    });
    await Promise.resolve();
    const vnode2 = Await({
      promise,
      children: (data: string) => h('span'),
      error: (err) => h('p', null, err.message),
    });
    expect(vnode2.type).toBe('p');
    expect(vnode2.children![0].props.value).toBe('fail');
  });

  it('accepts promise factory', () => {
    const fn = vi.fn(() => new Promise<string>(() => {}));
    const vnode = Await({
      promise: fn,
      children: (data: string) => h('span'),
    });
    expect(fn).toHaveBeenCalled();
  });
});
