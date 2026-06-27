import { getCurrentContext, getContextStack } from './hooks';

export interface Context<T> {
  id: symbol;
  defaultValue: T;
  Provider: {
    render: (props: { value: T; children?: any }) => any;
  };
}

export function createContext<T>(defaultValue: T): Context<T> {
  const id = Symbol('context');

  return {
    id,
    defaultValue,
    Provider: {
      render: (props: { value: T; children?: any }) => {
        const ctx = getCurrentContext();
        if (ctx) {
          if (!ctx.contextCache) ctx.contextCache = new Map();
          ctx.contextCache.set(id, props.value);
        }
        const children = Array.isArray(props.children)
          ? { type: 'fragment', props: {}, children: props.children }
          : props.children || { type: 'empty', props: {} };
        return children;
      },
    },
  };
}

export function useContext<T>(context: Context<T>): T {
  const stack = getContextStack();
  for (let i = stack.length - 1; i >= 0; i--) {
    const ctx = stack[i];
    if (ctx.contextCache?.has(context.id)) {
      return ctx.contextCache.get(context.id) as T;
    }
  }
  return context.defaultValue;
}

export function provideContext<T>(context: Context<T>, value: T): void {
  const ctx = getCurrentContext();
  if (ctx) {
    if (!ctx.contextCache) ctx.contextCache = new Map();
    ctx.contextCache.set(context.id, value);
  }
}
