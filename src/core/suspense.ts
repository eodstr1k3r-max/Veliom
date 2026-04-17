import type { VNode } from './renderer';
import type { LazyComponent } from './lazy';
import type { ComponentRender } from './component';

export interface SuspenseProps {
  children: LazyComponent | ComponentRender;
  fallback?: VNode;
}

export function Suspense(props: SuspenseProps): VNode {
  const isLazy = 'load' in props.children;
  
  if (isLazy) {
    const lazyComp = props.children as LazyComponent;
    
    if (lazyComp.loaded) {
      return lazyComp.render({}) as VNode;
    }

    if (lazyComp.error) {
      return props.fallback || { type: 'empty', props: {} };
    }

    lazyComp.load().catch(() => {});

    return props.fallback || { type: 'empty', props: {} };
  }

  const renderFn = props.children as ComponentRender;
  return renderFn({}) as VNode;
}

export function createSuspense(fallback: VNode): {
  Suspense: (props: { children: LazyComponent }) => VNode;
  preload: (component: LazyComponent) => void;
} {
  return {
    Suspense: (props: { children: LazyComponent }) => {
      return Suspense({ ...props, fallback });
    },
    preload: (component: LazyComponent) => {
      component.load();
    },
  };
}
