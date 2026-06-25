import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { createPortal, setPortalContainer } from '../src/core/portal';
import { h, render } from '../src/core/renderer';

let container: HTMLElement;
let portalTarget: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
  portalTarget = document.createElement('div');
  portalTarget.id = 'portal-target';
  document.body.appendChild(portalTarget);
});

afterEach(() => {
  if (container.parentNode) document.body.removeChild(container);
  if (portalTarget.parentNode) document.body.removeChild(portalTarget);
});

describe('createPortal', () => {
  it('creates a portal VNode with type portal', () => {
    const vnode = createPortal({ children: h('span', null, 'in portal') });
    expect(vnode.type).toBe('portal');
  });

  it('renders portal child into target element', () => {
    const vnode = createPortal({
      children: h('span', { id: 'portal-child' }, 'portal text'),
      target: portalTarget,
    });
    render(vnode, container);
    const child = document.querySelector('#portal-child');
    expect(child).toBeTruthy();
    expect(child!.textContent).toBe('portal text');
    expect(portalTarget.contains(child)).toBe(true);
  });

  it('renders portal child into body when no target given', () => {
    const vnode = createPortal({
      children: h('div', { id: 'body-portal' }, 'body'),
    });
    render(vnode, container);
    const child = document.querySelector('#body-portal');
    expect(child).toBeTruthy();
    expect(document.body.contains(child)).toBe(true);
  });

  it('renders portal child into custom setPortalContainer', () => {
    setPortalContainer(portalTarget);
    const vnode = createPortal({
      children: h('p', { id: 'custom-portal' }, 'custom'),
    });
    render(vnode, container);
    const child = document.querySelector('#custom-portal');
    expect(child).toBeTruthy();
    expect(portalTarget.contains(child)).toBe(true);
  });
});
