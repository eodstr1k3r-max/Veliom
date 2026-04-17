import { Component, ComponentProps } from '../core/component';
export interface LazyOptions {
    fallback?: import('../core/renderer').VNode;
    errorBoundary?: import('../core/error').ErrorBoundaryComponent;
}
export interface LazyComponent<P = ComponentProps> extends Component<P> {
    load: () => Promise<{
        default: Component<P>;
    }>;
    loaded: boolean;
    error: Error | null;
}
export declare function lazy<P = ComponentProps>(loader: () => Promise<{
    default: Component<P>;
}>, options?: LazyOptions): LazyComponent<P>;
export declare function preload<P = ComponentProps>(component: LazyComponent<P>): Promise<{
    default: Component<P>;
}>;
//# sourceMappingURL=lazy.d.ts.map