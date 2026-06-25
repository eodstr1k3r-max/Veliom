import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Teleport } from '../src/core/teleport';
import { h, render } from '../src/core/renderer';

let container: HTMLElement;
let target: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  target = document.createElement('div');
  target.id = 'teleport-target';
  document.body.appendChild(target);
});

afterEach(() => {
  if (container.parentNode) document.body.removeChild(container);
  if (target.parentNode) document.body.removeChild(target);
});

describe('Teleport', () => {
  it('renders into a query selector target', () => {
    const vnode = Teleport({
      to: '#teleport-target',
      children: h('span', { id: 'tel' }, 'teleported'),
    });
    render(vnode, container);
    const child = document.querySelector('#tel');
    expect(child).toBeTruthy();
    expect(target.contains(child)).toBe(true);
  });

  it('renders into an element reference', () => {
    const vnode = Teleport({
      to: target,
      children: h('p', { id: 'tel-el' }, 'ref'),
    });
    render(vnode, container);
    const child = document.querySelector('#tel-el');
    expect(child).toBeTruthy();
    expect(target.contains(child)).toBe(true);
  });
});
