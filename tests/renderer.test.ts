import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { h, render, patch, createElement } from '../src/core/renderer';

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  container.innerHTML = '';
  if (container.parentNode) document.body.removeChild(container);
});

describe('h() - VNode Creation', () => {
  it('creates a VNode with type and props', () => {
    const vnode = h('div', { className: 'test' });
    expect(vnode.type).toBe('div');
    expect(vnode.props.className).toBe('test');
  });

  it('handles null props', () => {
    const vnode = h('span', null);
    expect(vnode.type).toBe('span');
  });

  it('flattens children', () => {
    const vnode = h('ul', null, h('li'), h('li'));
    expect(vnode.children).toHaveLength(2);
  });

  it('converts string children to text vnodes', () => {
    const vnode = h('p', null, 'hello');
    expect(vnode.children![0].type).toBe('text');
    expect(vnode.children![0].props.value).toBe('hello');
  });

  it('converts number children to text vnodes', () => {
    const vnode = h('p', null, 42);
    expect(vnode.children![0].type).toBe('text');
    expect(vnode.children![0].props.value).toBe(42);
  });

  it('filters out null, undefined, and empty string children', () => {
    const vnode = h('div', null, null, undefined, '', 'text');
    expect(vnode.children).toHaveLength(1);
    expect(vnode.children![0].props.value).toBe('text');
  });

  it('extracts key prop from props', () => {
    const vnode = h('div', { key: 'my-key' });
    expect(vnode.key).toBe('my-key');
  });

  it('creates unique VNodes for different calls', () => {
    const v1 = h('a');
    const v2 = h('b');
    expect(v1.type).toBe('a');
    expect(v2.type).toBe('b');
  });
});

describe('render()', () => {
  it('renders a simple element', () => {
    render(h('div', { id: 'root' }, 'content'), container);
    const el = container.querySelector('#root')!;
    expect(el).toBeTruthy();
    expect(el.textContent).toBe('content');
  });

  it('renders nested elements', () => {
    render(h('div', null, h('span', { className: 'inner' }, 'nested')), container);
    expect(container.querySelector('span.inner')).toBeTruthy();
  });

  it('renders fragments', () => {
    render(h('fragment', null, h('p', null, 'a'), h('p', null, 'b')), container);
    expect(container.children).toHaveLength(2);
  });

  it('renders text nodes', () => {
    render(h('div', null, 'text content'), container);
    expect(container.querySelector('div')!.textContent).toBe('text content');
  });

  it('removes previous content', () => {
    render(h('div', null, 'first'), container);
    render(h('span', null, 'second'), container);
    expect(container.querySelector('div')).toBeNull();
    expect(container.querySelector('span')).toBeTruthy();
  });
});

describe('classList / dynamic class support', () => {
  it('renders className as string', () => {
    render(h('div', { className: 'foo bar' }), container);
    expect(container.querySelector('div')!.getAttribute('class')).toBe('foo bar');
  });

  it('renders classList as array', () => {
    render(h('div', { classList: ['foo', 'bar'] }), container);
    expect(container.querySelector('div')!.getAttribute('class')).toBe('foo bar');
  });

  it('renders classList as object', () => {
    render(h('div', { classList: { foo: true, bar: false, baz: true } }), container);
    expect(container.querySelector('div')!.getAttribute('class')).toBe('foo baz');
  });

  it('updates classList array via patch', () => {
    const v1 = h('div', { classList: ['a', 'b'] });
    const v2 = h('div', { classList: ['c', 'd'] });
    render(v1, container);
    patch(container, v1, v2);
    expect(container.querySelector('div')!.getAttribute('class')).toBe('c d');
  });

  it('removes class when classList removed via patch', () => {
    const v1 = h('div', { classList: ['x'] });
    const v2 = h('div', {});
    render(v1, container);
    patch(container, v1, v2);
    expect(container.querySelector('div')!.hasAttribute('class')).toBe(false);
  });
});

describe('patch() - Reconciliation', () => {
  it('updates text content', () => {
    const v1 = h('div', null, 'old');
    const v2 = h('div', null, 'new');
    render(v1, container);
    patch(container, v1, v2);
    expect(container.querySelector('div')!.textContent).toBe('new');
  });

  it('updates attributes', () => {
    const v1 = h('div', { className: 'old' });
    const v2 = h('div', { className: 'new' });
    render(v1, container);
    patch(container, v1, v2);
    expect(container.querySelector('div')!.getAttribute('class')).toBe('new');
  });

  it('removes old attributes', () => {
    const v1 = h('div', { title: 'hello', 'data-test': 'val' });
    const v2 = h('div', { title: 'hello' });
    render(v1, container);
    patch(container, v1, v2);
    expect(container.querySelector('div')!.getAttribute('data-test')).toBeNull();
  });

  it('replaces element when type changes', () => {
    const v1 = h('p', null, 'text');
    const v2 = h('span', null, 'text');
    render(v1, container);
    patch(container, v1, v2);
    expect(container.querySelector('span')).toBeTruthy();
    expect(container.querySelector('p')).toBeNull();
  });

  it('handles same VNode reference (no-op)', () => {
    const v = h('div', null, 'stable');
    render(v, container);
    patch(container, v, v);
    expect(container.querySelector('div')!.textContent).toBe('stable');
  });

  it('adds new children', () => {
    const v1 = h('ul', null, h('li', null, 'a'));
    const v2 = h('ul', null, h('li', null, 'a'), h('li', null, 'b'));
    render(v1, container);
    patch(container, v1, v2);
    expect(container.querySelectorAll('li')).toHaveLength(2);
  });

  it('removes children', () => {
    const v1 = h('ul', null, h('li', null, 'a'), h('li', null, 'b'));
    const v2 = h('ul', null, h('li', null, 'a'));
    render(v1, container);
    patch(container, v1, v2);
    expect(container.querySelectorAll('li')).toHaveLength(1);
  });
});

describe('patch() - Keyed Reconciliation', () => {
  it('reorders keyed children', () => {
    const v1 = h('ul', null,
      h('li', { key: 'a' }, 'A'),
      h('li', { key: 'b' }, 'B'),
      h('li', { key: 'c' }, 'C')
    );
    const v2 = h('ul', null,
      h('li', { key: 'c' }, 'C'),
      h('li', { key: 'a' }, 'A'),
      h('li', { key: 'b' }, 'B')
    );
    render(v1, container);
    patch(container, v1, v2);
    const items = container.querySelectorAll('li');
    expect(items[0].textContent).toBe('C');
    expect(items[1].textContent).toBe('A');
    expect(items[2].textContent).toBe('B');
  });
});

describe('createElement() - XSS Safety', () => {
  it('blocks javascript: href', () => {
    const el = createElement(h('a', { href: 'javascript:alert(1)' }));
    expect(el.getAttribute('href')).toBeNull();
  });

  it('allows https: href', () => {
    const el = createElement(h('a', { href: 'https://safe.com' }));
    expect(el.getAttribute('href')).toBe('https://safe.com');
  });

  it('renders text content safely', () => {
    const el = createElement(h('div', null, '<script>evil()</script>'));
    expect(el.querySelector('script')).toBeNull();
    expect(el.textContent).toBe('<script>evil()</script>');
  });

  it('applies style objects', () => {
    const el = createElement(h('div', { style: { color: 'red', fontSize: '14px' } }));
    expect(el.style.color).toBe('red');
  });
});

describe('Events', () => {
  it('attaches and triggers click handler', () => {
    const handler = vi.fn();
    render(h('button', { id: 'btn', onClick: handler }, 'Click'), container);
    container.querySelector('#btn')!.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('detaches handler on attribute removal via patch', () => {
    const handler = vi.fn();
    const v1 = h('button', { id: 'btn', onClick: handler }, 'Click');
    const v2 = h('button', { id: 'btn' }, 'Click');
    render(v1, container);
    patch(container, v1, v2);
    container.querySelector('#btn')!.click();
    expect(handler).not.toHaveBeenCalled();
  });

  it('ignores string event props', () => {
    const el = createElement(h('button', { onClick: 'alert(1)' } as any));
    expect(typeof (el as any).onclick).not.toBe('function');
  });
});

describe('Fragments', () => {
  it('renders fragment children directly', () => {
    render(h('fragment', null, h('span', { id: 'a' }), h('span', { id: 'b' })), container);
    expect(container.children).toHaveLength(2);
    expect(container.querySelector('#a')).toBeTruthy();
    expect(container.querySelector('#b')).toBeTruthy();
  });
});
