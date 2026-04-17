import { describe, it, expect, beforeEach } from 'vitest';
import { h, render, patch, VNode } from '../src/core/renderer';

describe('Renderer', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  describe('h() - VNode creation', () => {
    it('should create a basic element vnode', () => {
      const vnode = h('div', null, 'Hello');
      expect(vnode.type).toBe('div');
      expect(vnode.children).toHaveLength(1);
    });

    it('should create element with props', () => {
      const vnode = h('button', { className: 'btn', disabled: true }, 'Click');
      expect(vnode.type).toBe('button');
      expect(vnode.props.className).toBe('btn');
      expect(vnode.props.disabled).toBe(true);
    });

    it('should create nested elements', () => {
      const vnode = h('div', null,
        h('h1', null, 'Title'),
        h('p', null, 'Description')
      );
      expect(vnode.children).toHaveLength(2);
    });

    it('should filter out null/undefined children', () => {
      const vnode = h('div', null, null, 'Hello', undefined, 'World');
      expect(vnode.children).toHaveLength(2);
    });
  });

  describe('render() - Initial rendering', () => {
    it('should render a simple element', () => {
      const vnode = h('div', null, 'Hello World');
      render(vnode, container);
      expect(container.innerHTML).toBe('<div>Hello World</div>');
    });

    it('should render nested elements', () => {
      const vnode = h('div', null,
        h('h1', null, 'Title'),
        h('p', null, 'Paragraph')
      );
      render(vnode, container);
      expect(container.innerHTML).toBe('<div><h1>Title</h1><p>Paragraph</p></div>');
    });

    it('should render text content', () => {
      const vnode = h('span', null, 'Text');
      render(vnode, container);
      expect(container.innerHTML).toBe('<span>Text</span>');
    });

    it('should render with attributes', () => {
      const vnode = h('input', { type: 'text', placeholder: 'Enter text' });
      render(vnode, container);
      expect(container.querySelector('input')?.getAttribute('type')).toBe('text');
      expect(container.querySelector('input')?.getAttribute('placeholder')).toBe('Enter text');
    });

    it('should handle className prop', () => {
      const vnode = h('div', { className: 'container active' });
      render(vnode, container);
      expect(container.querySelector('div')?.className).toBe('container active');
    });
  });

  describe('patch() - Updates', () => {
    it('should update text content', () => {
      const oldVNode = h('p', null, 'Old text');
      const newVNode = h('p', null, 'New text');
      render(oldVNode, container);
      patch(container, oldVNode, newVNode);
      expect(container.innerHTML).toBe('<p>New text</p>');
    });

    it('should update attributes', () => {
      const oldVNode = h('button', { disabled: false }, 'Click');
      const newVNode = h('button', { disabled: true }, 'Click');
      render(oldVNode, container);
      patch(container, oldVNode, newVNode);
      expect(container.querySelector('button')?.disabled).toBe(true);
    });

    it('should add new children', () => {
      const oldVNode = h('div', null);
      const newVNode = h('div', null, h('span', null, 'New child'));
      render(oldVNode, container);
      patch(container, oldVNode, newVNode);
      expect(container.innerHTML).toBe('<div><span>New child</span></div>');
    });

    it('should remove children', () => {
      const oldVNode = h('div', null, h('span', null, 'To remove'));
      const newVNode = h('div', null);
      render(oldVNode, container);
      patch(container, oldVNode, newVNode);
      expect(container.innerHTML).toBe('<div></div>');
    });
  });
});
