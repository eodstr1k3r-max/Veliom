export type RefCallback<T> = (element: T | null) => void;

export type Ref<T = Element> = RefCallback<T> | { current: T | null };

export function mergeRefs<T>(...refs: Ref<T>[]): RefCallback<T> {
  return (element: T | null) => {
    for (let i = 0; i < refs.length; i++) {
      const ref = refs[i];
      if (typeof ref === 'function') {
        ref(element);
      } else if (ref && 'current' in ref) {
        ref.current = element;
      }
    }
  };
}

export function createRef<T = Element>(): RefObject<T> {
  return { current: null };
}

export interface RefObject<T = Element> {
  current: T | null;
}
