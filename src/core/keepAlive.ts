import type { VNode } from './renderer.js';

interface CacheEntry {
  vnode: VNode;
  element: Element | Text | Node[] | null;
}

const cache = new Map<string, CacheEntry>();
const keyCounter = { value: 0 };
const MAX_CACHE_SIZE = 50;

export function KeepAlive(props: {
  children: VNode;
  key?: string;
}): VNode {
  const cacheKey = props.key ?? `__keepalive_${++keyCounter.value}`;

  const cached = cache.get(cacheKey);
  if (cached) {
    // Refresh LRU order on hit.
    cache.delete(cacheKey);
    cache.set(cacheKey, cached);
    return cached.vnode;
  }

  if (cache.size >= MAX_CACHE_SIZE) {
    const oldestKey = cache.keys().next().value;
    if (oldestKey !== undefined) cache.delete(oldestKey);
  }

  // Pure: no DOM side-effects here — the renderer inserts the returned VNode.
  // Store a ref-free snapshot so later mutations of the live VNode (ref, etc.)
  // don't corrupt the cache entry.
  const snapshot: VNode = {
    ...props.children,
    props: { ...(props.children.props ?? {}) },
    children: props.children.children ? [...props.children.children] : undefined,
  };
  cache.set(cacheKey, { vnode: snapshot, element: null });
  return snapshot;
}

export function clearKeepAliveCache(key?: string): void {
  if (key !== undefined) {
    cache.delete(key);
  } else {
    cache.clear();
  }
}
