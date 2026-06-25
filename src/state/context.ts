import { getCurrentContext } from './hooks';

export interface Context<T> {
  id: symbol;
  defaultValue: T;
  Provider: {
    render: (props: { value: T; children?: any }) => any;
  };
}

const contextValues = new Map<symbol, unknown[]>();

export function createContext<T>(defaultValue: T): Context<T> {
  const id = Symbol('context');

  return {
    id,
    defaultValue,
    Provider: {
      render: (props: { value: T; children?: any }) => {
        const stack = contextValues.get(id) || [];
        stack.push(props.value);
        contextValues.set(id, stack);
        const children = Array.isArray(props.children)
          ? { type: 'fragment', props: {}, children: props.children }
          : props.children || { type: 'empty', props: {} };
        return children;
      },
    },
  };
}

export function useContext<T>(context: Context<T>): T {
  const ctx = getCurrentContext();
  if (ctx && ctx.contextCache?.has(context.id)) {
    return ctx.contextCache.get(context.id) as T;
  }
  const stack = contextValues.get(context.id);
  if (stack && stack.length > 0) {
    return stack[stack.length - 1] as T;
  }
  return context.defaultValue;
}

export function provideContext<T>(context: Context<T>, value: T): void {
  contextValues.set(context.id, [value]);
}
