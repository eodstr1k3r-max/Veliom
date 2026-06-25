import { describe, it, expect } from 'vitest';
import { toArray, Children } from '../src/utils/children';
import { h } from '../src/core/renderer';

describe('children utilities', () => {
  it('toArray returns empty array for null/undefined', () => {
    expect(toArray(null)).toEqual([]);
    expect(toArray(undefined)).toEqual([]);
  });

  it('toArray wraps single child in array', () => {
    const v = h('div');
    expect(toArray(v)).toEqual([v]);
  });

  it('toArray flattens fragments', () => {
    const inner = h('span');
    const frag = h('fragment', null, inner);
    expect(toArray(frag)).toEqual([inner]);
  });

  it('toArray recursively flattens nested fragments', () => {
    const inner = h('span');
    const mid = h('fragment', null, inner);
    const outer = h('fragment', null, mid);
    expect(toArray(outer)).toEqual([inner]);
  });

  it('Children.only returns single child', () => {
    const v = h('p');
    expect(Children.only(v)).toBe(v);
  });

  it('Children.only throws for multiple children', () => {
    expect(() => Children.only([h('div'), h('span')])).toThrow('exactly one child');
  });

  it('Children.count returns correct number', () => {
    expect(Children.count([h('div'), h('span'), h('p')])).toBe(3);
    expect(Children.count(null)).toBe(0);
  });

  it('Children.map transforms children', () => {
    const children = [h('div'), h('span')];
    const result = Children.map(children, (c, i) => ({ type: c.type, index: i }));
    expect(result).toEqual([{ type: 'div', index: 0 }, { type: 'span', index: 1 }]);
  });

  it('Children.forEach iterates all children', () => {
    const children = [h('a'), h('b')];
    const items: string[] = [];
    Children.forEach(children, (c) => items.push(c.type as string));
    expect(items).toEqual(['a', 'b']);
  });
});
