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
    const entry = cache.get(cacheKey)!;
    const el = entry.element;
    return {
      type: 'keepAlive',
      props: { cacheKey, cachedVNode: entry.vnode, cachedElement: el },
      children: [entry.vnode],
    };
  }

  const el = createElement(props.children);
  if (props.children) {
    const result: Element | Text | Node[] = Array.isArray(el) ? el : el!;
    cache.set(cacheKey, { vnode: props.children, element: result });
    props.children.ref = Array.isArray(result) ? (result[0] as Element) : (result as Element);
  }
  return props.children;
}

export function clearKeepAliveCache(key?: string): void {
  if (key) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
