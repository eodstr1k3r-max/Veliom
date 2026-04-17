import { describe, it, expect } from 'vitest';
import { Fragment, Show, For, Index } from '../src/core/control';
import { h } from '../src/core/renderer';

describe('Control Flow', () => {
  describe('Fragment', () => {
    it('should render children as fragment', () => {
      const fragment = Fragment({
        children: [
          h('div', null, 'Child 1'),
          h('div', null, 'Child 2')
        ]
      });
      expect(fragment.type).toBe('fragment');
      expect(fragment.children).toHaveLength(2);
    });

    it('should handle empty children', () => {
      const fragment = Fragment({});
      expect(fragment.type).toBe('fragment');
      expect(fragment.children).toBeUndefined();
    });
  });

  describe('Show', () => {
    it('should render children when condition is true', () => {
      const vnode = Show({
        when: true,
        children: h('div', null, 'Visible')
      });
      expect(vnode.type).toBe('div');
      expect((vnode.children?.[0] as any)?.props?.value).toBe('Visible');
    });

    it('should render fallback when condition is false', () => {
      const vnode = Show({
        when: false,
        children: h('div', null, 'Hidden'),
        fallback: h('div', null, 'Fallback')
      });
      expect(vnode.type).toBe('div');
      expect((vnode.children?.[0] as any)?.props?.value).toBe('Fallback');
    });

    it('should render empty when no fallback and condition is false', () => {
      const vnode = Show({
        when: false,
        children: h('div', null, 'Hidden')
      });
      expect(vnode.type).toBe('empty');
    });
  });

  describe('For', () => {
    it('should render list of items', () => {
      const items = ['a', 'b', 'c'];
      const vnode = For({
        each: items,
        children: (item) => h('li', { key: item }, item)
      });
      expect(vnode.type).toBe('fragment');
      expect(vnode.children).toHaveLength(3);
    });

    it('should provide index to children', () => {
      const items = ['x', 'y'];
      const vnode = For({
        each: items,
        children: (item, index) => h('div', { key: item }, `${index}:${item}`)
      });
      const firstChild = vnode.children![0] as any;
      expect(firstChild.type).toBe('div');
      expect(firstChild.children?.[0]?.props?.value).toBe('0:x');
    });

    it('should handle empty array', () => {
      const vnode = For({
        each: [],
        children: (item) => h('div', null, item)
      });
      expect(vnode.children).toHaveLength(0);
    });
  });
});
