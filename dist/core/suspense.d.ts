import type { VNode } from './renderer';
import type { LazyComponent } from './lazy';
import type { ComponentRender } from './component';
export interface SuspenseProps {
    children: LazyComponent | ComponentRender;
    fallback?: VNode;
}
export declare function Suspense(props: SuspenseProps): VNode;
export declare function createSuspense(fallback: VNode): {
    Suspense: (props: {
        children: LazyComponent;
    }) => VNode;
    preload: (component: LazyComponent) => void;
};
//# sourceMappingURL=suspense.d.ts.map