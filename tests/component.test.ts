import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createComponent, mount, update, unmount, Component } from '../src/core/component';
import { h, render } from '../src/core/renderer';
import { Dynamic } from '../src/core/dynamic';

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  if (container.parentNode) document.body.removeChild(container);
});

describe('createComponent', () => {
  it('creates a component with a render function', () => {
    const Comp = createComponent(() => h('div', null, 'hello'));
    expect(typeof Comp.render).toBe('function');
  });

  it('renders via the component render method', () => {
    const Comp = createComponent(() => h('span', { id: 'test' }, 'comp'));
    const vnode = Comp.render({});
    expect(vnode.type).toBe('span');
  });
});

describe('mount', () => {
  it('mounts a component into a container', () => {
    const Comp = createComponent(() => h('p', { id: 'mounted' }, 'text'));
    mount(Comp, container);
    expect(container.querySelector('#mounted')).toBeTruthy();
    expect(container.querySelector('#mounted')!.textContent).toBe('text');
  });

  it('mounts with props', () => {
    const Comp = createComponent((props: { label: string }) =>
      h('span', null, props.label)
    );
    mount(Comp, container, { label: 'hello' });
    expect(container.querySelector('span')!.textContent).toBe('hello');
  });

  it('mounts with a direct render function', () => {
    mount(() => h('div', { id: 'fn' }), container);
    expect(container.querySelector('#fn')).toBeTruthy();
  });
});

describe('update', () => {
  it('updates a mounted component with new props', () => {
    const Comp = createComponent((props: { val: string }) =>
      h('span', { id: 'upd' }, props.val)
    );
    mount(Comp, container, { val: 'old' });
    expect(container.querySelector('#upd')!.textContent).toBe('old');
    update(container, { val: 'new' });
    expect(container.querySelector('#upd')!.textContent).toBe('new');
  });

  it('warns if container is not mounted', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    update(container, {});
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('unmount', () => {
  it('unmounts a component and clears container', () => {
    mount(() => h('div', { id: 'rem' }), container);
    expect(container.querySelector('#rem')).toBeTruthy();
    unmount(container);
    expect(container.innerHTML).toBe('');
  });

  it('warns for non-mounted container', () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    unmount(container);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });
});

describe('Dynamic component', () => {
  it('renders nothing when no component prop', () => {
    const vnode = Dynamic({});
    expect(vnode.type).toBe('empty');
  });

  it('renders a string tag as native element', () => {
    const vnode = Dynamic({ component: 'div', className: 'box', children: h('span', null, 'inside') });
    expect(vnode.type).toBe('div');
    expect(vnode.props.className).toBe('box');
    expect(vnode.children![0].type).toBe('span');
  });

  it('renders a function component', () => {
    const vnode = Dynamic({
      component: (props: Record<string, unknown>) => h('p', { id: props.id as string }, props.label as string),
      id: 'dyn',
      label: 'dynamic',
    });
    expect(vnode.type).toBe('p');
    expect(vnode.props.id).toBe('dyn');
    expect(vnode.children![0].props.value).toBe('dynamic');
  });
});

describe('Component with children', () => {
  it('renders component with children', () => {
    const Comp = createComponent((props: { children?: any }) =>
      h('div', { className: 'wrapper' }, ...(Array.isArray(props.children) ? props.children : [props.children]))
    );
    mount(Comp, container, { children: [h('span', null, 'child')] });
    expect(container.querySelector('.wrapper')).toBeTruthy();
    expect(container.querySelector('.wrapper')!.textContent).toBe('child');
  });
});
