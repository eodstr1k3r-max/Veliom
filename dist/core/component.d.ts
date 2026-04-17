import { h, VNode } from './renderer';
export interface ComponentProps {
    children?: VNode[];
    [key: string]: unknown;
}
export type ComponentRender<P = ComponentProps> = (props: P) => VNode;
export interface Component<P = ComponentProps> {
    render: ComponentRender<P>;
}
export type ComponentInstance = {
    vnode: VNode | null;
    container: Element | null;
    component: Component<ComponentProps>;
    props: ComponentProps;
};
export declare function createComponent<P = ComponentProps>(renderFn: ComponentRender<P>): Component<P>;
export declare function mount<P = ComponentProps>(component: Component<P>, container: Element, props?: P): void;
export declare function update<P = ComponentProps>(container: Element, newProps: Partial<P>): void;
export declare function unmount(container: Element): void;
export { h };
//# sourceMappingURL=component.d.ts.map