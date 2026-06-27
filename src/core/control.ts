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

const MATCH_TYPE = 'match';

export function Switch(props: {
  children: VNode | VNode[];
  fallback?: VNode;
}): VNode {
  const children = Array.isArray(props.children) ? props.children : [props.children];
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child && child.type === MATCH_TYPE && child.props.when) {
      const whenChildren = child.props.children as VNode | (() => VNode) | undefined;
      if (typeof whenChildren === 'function') {
        return whenChildren();
      }
      return whenChildren || { type: 'empty', props: {} };
    }
  }
  return props.fallback || { type: 'empty', props: {} };
}

export function Match(props: {
  when: boolean;
  children?: VNode | (() => VNode);
}): VNode {
  return {
    type: MATCH_TYPE,
    props: { when: props.when, children: props.children },
  };
}

export function For<T>(props: {
  each: T[];
  children: (item: T, index: number) => VNode;
  key?: (item: T, index: number) => string | number;
}): VNode {
  if (!props.each) return { type: 'empty', props: {} };
  const children: VNode[] = [];
  for (let i = 0; i < props.each.length; i++) {
    const child = props.children(props.each[i], i);
    if (!child) continue;
    const key = props.key ? String(props.key(props.each[i], i)) : String(i);
    children.push(cloneVNodeWithKey(child, key));
  }
  return {
    type: 'fragment',
    props: {},
    children,
  };
}

function cloneVNodeWithKey(vnode: VNode, key: string | number): VNode {
  return {
    ...vnode,
    key: String(key),
    props: { ...vnode.props },
    children: vnode.children ? vnode.children.map(c => c ? { ...c, props: { ...c.props }, children: c.children ? [...c.children] : undefined } : c) : undefined,
  };
}

export function Index<T>(props: {
  each: T[];
  children: (item: () => T, index: number) => VNode;
  key?: (item: T, index: number) => string | number;
}): VNode {
  if (!props.each) return { type: 'empty', props: {} };
  const children: VNode[] = [];
  for (let i = 0; i < props.each.length; i++) {
    const getter = () => props.each[i];
    const child = props.children(getter, i);
    if (!child) continue;
    const key = props.key ? String(props.key(props.each[i], i)) : String(i);
    children.push(cloneVNodeWithKey(child, key));
  }
  return {
    type: 'fragment',
    props: {},
    children,
  };
}
