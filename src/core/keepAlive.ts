import { VNode, createElement } from './renderer';

interface CacheEntry {
  vnode: VNode;
  element: Element | Text | Node[];
}

const cache = new Map<string, CacheEntry>();

export function KeepAlive(props: {
  children: VNode;
  key?: string;
}): VNode {
  const cacheKey = props.key ?? 'default';

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!.vnode;
  }

  const el = createElement(props.children);
  if (props.children) {
    const result = Array.isArray(el) ? el : (el as Element | Text);
    cache.set(cacheKey, { vnode: props.children, element: result });
    props.children.ref = Array.isArray(result) ? (result[0] as Element) : (result as Element);
  }
  return props.children;
}

export function clearKeepAliveCache(key?: string): void {
  if (key !== undefined) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
