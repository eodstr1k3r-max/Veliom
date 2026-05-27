import { VNode } from '../core/renderer';

function flattenFragment(children: VNode[]): VNode[] {
  const result: VNode[] = [];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child && child.type === 'fragment' && child.children) {
      result.push(...flattenFragment(child.children));
    } else if (child) {
      result.push(child);
    }
  }
  return result;
}

export function toArray(children: VNode | VNode[] | undefined | null): VNode[] {
  if (!children) return [];
  if (Array.isArray(children)) {
    return flattenFragment(children);
  }
  if (children.type === 'fragment' && children.children) {
    return flattenFragment(children.children);
  }
  return [children];
}

export function forEach(
  children: VNode | VNode[] | undefined | null,
  fn: (child: VNode, index: number) => void
): void {
  toArray(children).forEach(fn);
}

export function map<T>(
  children: VNode | VNode[] | undefined | null,
  fn: (child: VNode, index: number) => T
): T[] {
  return toArray(children).map(fn);
}

export function only(children: VNode | VNode[] | undefined | null): VNode {
  const arr = toArray(children);
  if (arr.length !== 1) {
    throw new Error(`Children.only expected exactly one child, got ${arr.length}`);
  }
  return arr[0];
}

export function count(children: VNode | VNode[] | undefined | null): number {
  return toArray(children).length;
}

export const Children = { toArray, forEach, map, only, count };
