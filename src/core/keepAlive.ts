import { VNode, createElement } from './renderer';

interface CacheEntry {
  vnode: VNode;
  element: Element | Text | Node[];
}

const cache = new Map<string, CacheEntry>();
const keyCounter = { value: 0 };
const MAX_CACHE_SIZE = 50;

export function KeepAlive(props: {
  children: VNode;
  key?: string;
}): VNode {
  const cacheKey = props.key ?? `__keepalive_${++keyCounter.value}`;

  if (cache.has(cacheKey)) {
    return cache.get(cacheKey)!.vnode;
  }

  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
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
