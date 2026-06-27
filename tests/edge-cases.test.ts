import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { h, render, patch } from '../src/core/renderer';
import { For, Index } from '../src/core/control';
import { createPortal } from '../src/core/portal';
import { renderToString } from '../src/core/ssr';
import { scheduleDOMUpdate, flushDOMUpdates } from '../src/core/scheduler';

let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  if (container.parentNode) document.body.removeChild(container);
});

describe('Edge Cases', () => {
  it('renders empty vnode', () => {
    render({ type: 'empty', props: {} }, container);
    expect(container.innerHTML).toBe('');
  });

  it('renders fragment with no children', () => {
    render(h('fragment'), container);
    expect(container.children).toHaveLength(0);
  });

  it('handles null children in h()', () => {
    render(h('div', null, null, h('span'), undefined), container);
    expect(container.querySelector('span')).toBeTruthy();
  });

  it('patches from empty to element', () => {
    const oldV = { type: 'empty', props: {} };
    const newV = h('div', null, 'hello');
    render(oldV, container);
    patch(container, oldV, newV);
    expect(container.textContent).toBe('hello');
  });

  it('handles dangerouslySetInnerHTML', () => {
    render(h('div', { dangerouslySetInnerHTML: { __html: '<b>bold</b>' } }), container);
    expect(container.querySelector('b')?.textContent).toBe('bold');
  });

  it('clears dangerouslySetInnerHTML on patch', () => {
    const v1 = h('div', { dangerouslySetInnerHTML: { __html: '<b>bold</b>' } });
    const v2 = h('div', {});
    render(v1, container);
    patch(container, v1, v2);
    expect(container.querySelector('b')).toBeNull();
  });

  it('handles value attribute on input', () => {
    render(h('input', { value: 'test' }), container);
    const input = container.querySelector('input')! as HTMLInputElement;
    expect(input.value).toBe('test');
  });

  it('handles checked attribute on checkbox', () => {
    render(h('input', { type: 'checkbox', checked: true }), container);
    const input = container.querySelector('input')! as HTMLInputElement;
    expect(input.checked).toBe(true);
  });

  it('For with empty array', () => {
    const vnode = For({ each: [], children: () => h('div') });
    expect(vnode.children).toHaveLength(0);
  });

  it('For with null/undefined each', () => {
    const vnode1 = For({ each: null as any, children: () => h('div') });
    expect(vnode1.type).toBe('empty');
    const vnode2 = For({ each: undefined as any, children: () => h('div') });
    expect(vnode2.type).toBe('empty');
  });

  it('Index with empty array', () => {
    const vnode = Index({ each: [], children: () => h('div') });
    expect(vnode.children).toHaveLength(0);
  });

  it('Index getter returns current value', () => {
    const items = ['a', 'b'];
    const captured: string[] = [];
    Index({
      each: items,
      children: (getItem) => {
        captured.push(getItem());
        return h('div');
      }
    });
    expect(captured).toEqual(['a', 'b']);
  });

  it('renderToString handles void elements', () => {
    const html = renderToString(h('br'));
    expect(html).toBe('<br>');
  });

  it('renderToString handles dangerouslySetInnerHTML', () => {
    const html = renderToString(h('div', { dangerouslySetInnerHTML: { __html: '<b>safe</b>' } }));
    expect(html).toContain('<b>safe</b>');
  });

  it('renderToString escapes attribute values', () => {
    const html = renderToString(h('div', { title: 'a"b' }));
    expect(html).toContain('&quot;');
  });

  it('createPortal renders to target', () => {
    const target = document.createElement('div');
    const portal = createPortal({ children: h('span', null, 'portal'), target });
    render(portal, container);
    expect(target.querySelector('span')?.textContent).toBe('portal');
  });

  it('scheduleDOMUpdate batches and flushes', () => {
    const fn = vi.fn();
    scheduleDOMUpdate(fn);
    expect(fn).not.toHaveBeenCalled();
    flushDOMUpdates();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('multiple scheduleDOMUpdate calls batch in one flush', () => {
    const fn1 = vi.fn();
    const fn2 = vi.fn();
    scheduleDOMUpdate(fn1);
    scheduleDOMUpdate(fn2);
    flushDOMUpdates();
    expect(fn1).toHaveBeenCalledTimes(1);
    expect(fn2).toHaveBeenCalledTimes(1);
  });

  it('render removes previous container event listeners on re-render', () => {
    const handler = vi.fn();
    const container2 = document.createElement('div');
    document.body.appendChild(container2);

    const btn1 = h('button', { onClick: handler }, 'First');
    render(btn1, container);
    container.querySelector('button')!.click();
    expect(handler).toHaveBeenCalledTimes(1);

    const btn2 = h('button', { onClick: handler }, 'Second');
    render(btn2, container2);
    container2.querySelector('button')!.click();

    document.body.removeChild(container2);
  });
});
