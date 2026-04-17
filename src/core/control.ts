import { VNode } from './renderer';

export function Fragment(props: { children?: VNode[] }): VNode {
  return {
    type: 'fragment',
    props: {},
    children: props.children,
  };
}

export function Show(props: {
  when: boolean;
  children: VNode | (() => VNode);
  fallback?: VNode;
}): VNode {
  if (props.when) {
    return typeof props.children === 'function' ? props.children() : props.children;
  }
  return props.fallback || { type: 'empty', props: {} };
}

export function For<T>(props: {
  each: T[];
  children: (item: T, index: number) => VNode;
}): VNode {
  const children: VNode[] = [];
  for (let i = 0; i < props.each.length; i++) {
    children.push(props.children(props.each[i], i));
  }
  return {
    type: 'fragment',
    props: {},
    children,
  };
}

export function Index<T>(props: {
  each: T[];
  children: (item: () => T, index: number) => VNode;
}): VNode {
  const children: VNode[] = [];
  for (let i = 0; i < props.each.length; i++) {
    const getter = () => props.each[i];
    children.push(props.children(getter, i));
  }
  return {
    type: 'fragment',
    props: {},
    children,
  };
}
