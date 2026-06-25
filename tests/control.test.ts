import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Fragment, Show, Switch, Match, For, Index } from '../src/core/control';
import { h, render } from '../src/core/renderer';

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  if (container.parentNode) document.body.removeChild(container);
});

describe('Fragment', () => {
  it('creates a fragment VNode', () => {
    const vnode = Fragment({ children: [h('span'), h('span')] });
    expect(vnode.type).toBe('fragment');
    expect(vnode.children).toHaveLength(2);
  });

  it('renders fragment children into DOM', () => {
    const vnode = Fragment({ children: [h('span', { id: 'a' }), h('span', { id: 'b' })] });
    render(vnode, container);
    expect(container.children).toHaveLength(2);
  });
});

describe('Show', () => {
  it('renders children when when=true', () => {
    const vnode = Show({ when: true, children: h('p', { id: 'shown' }) });
    expect(vnode.type).toBe('p');
  });

  it('renders fallback when when=false', () => {
    const vnode = Show({
      when: false,
      children: h('p'),
      fallback: h('span', { id: 'fallback' })
    });
    expect(vnode.type).toBe('span');
  });

  it('renders empty node when when=false and no fallback', () => {
    const vnode = Show({ when: false, children: h('p') });
    expect(vnode.type).toBe('empty');
  });

  it('supports function-as-children for lazy evaluation', () => {
    const fn = vi.fn(() => h('div', { id: 'lazy' }));
    const vnode = Show({ when: true, children: fn });
    expect(fn).toHaveBeenCalled();
    expect(vnode.type).toBe('div');
  });

  it('does not evaluate function children when when=false', () => {
    const fn = vi.fn(() => h('div'));
    Show({ when: false, children: fn });
    expect(fn).not.toHaveBeenCalled();
  });
});

describe('Switch', () => {
  it('renders the first Match with when=true', () => {
    const vnode = Switch({
      children: [
        Match({ when: false, children: h('p', null, 'first') }),
        Match({ when: true, children: h('p', null, 'second') }),
        Match({ when: true, children: h('p', null, 'third') }),
      ],
    });
    expect(vnode.type).toBe('p');
    expect(vnode.children![0].props.value).toBe('second');
  });

  it('renders fallback when no Match matches', () => {
    const vnode = Switch({
      children: [Match({ when: false }), Match({ when: false })],
      fallback: h('span', null, 'none'),
    });
    expect(vnode.type).toBe('span');
  });

  it('renders empty when no match and no fallback', () => {
    const vnode = Switch({ children: [Match({ when: false })] });
    expect(vnode.type).toBe('empty');
  });

  it('handles single child', () => {
    const vnode = Switch({
      children: Match({ when: true, children: h('div', null, 'single') }),
    });
    expect(vnode.type).toBe('div');
  });
});

describe('Match (as child of Switch)', () => {
  it('renders function children when matched', () => {
    const vnode = Switch({
      children: Match({ when: true, children: () => h('button', null, 'click') }),
    });
    expect(vnode.type).toBe('button');
  });

  it('falls through when when=false', () => {
    const vnode = Switch({
      children: [Match({ when: false }), Match({ when: false })],
      fallback: h('span', null, 'none'),
    });
    expect(vnode.type).toBe('span');
  });
});

describe('For', () => {
  it('renders a list from array', () => {
    const vnode = For({
      each: [1, 2, 3],
      children: (item) => h('li', null, String(item)),
    });
    expect(vnode.type).toBe('fragment');
    expect(vnode.children).toHaveLength(3);
    expect(vnode.children![0].type).toBe('li');
  });

  it('assigns key from key function', () => {
    const vnode = For({
      each: [{ id: 'a' }, { id: 'b' }],
      children: (item) => h('div'),
      key: (item) => item.id,
    });
    expect(vnode.children![0].key).toBe('a');
    expect(vnode.children![1].key).toBe('b');
  });

  it('passes index to children', () => {
    const fn = vi.fn();
    For({
      each: ['x', 'y'],
      children: (item, index) => { fn(index); return h('span'); },
    });
    expect(fn).toHaveBeenNthCalledWith(1, 0);
    expect(fn).toHaveBeenNthCalledWith(2, 1);
  });
});

describe('Index', () => {
  it('renders a list with getter', () => {
    const vnode = Index({
      each: [10, 20, 30],
      children: (item) => h('span', null, String(item())),
    });
    expect(vnode.children).toHaveLength(3);
    expect(vnode.children![0].children![0].props.value).toBe('10');
  });

  it('assigns key from key function', () => {
    const vnode = Index({
      each: ['a', 'b'],
      children: (item) => h('div'),
      key: (item) => item,
    });
    expect(vnode.children![0].key).toBe('a');
  });
});
