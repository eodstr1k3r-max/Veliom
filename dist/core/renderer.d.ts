export interface VNode {
    type: string;
    props: Record<string, unknown>;
    children?: VNode[];
    key?: string;
    ref?: Element;
}
export interface DOMNode {
    type: string;
    element: Element | Text;
    vnode: VNode;
}
export declare function h(type: string, props?: Record<string, unknown> | null, ...children: (VNode | string | number | null | undefined)[]): VNode;
export declare function setEventContainer(container: Element): void;
export declare function render(vnode: VNode, container: Element): void;
export declare function patch(container: Element, oldVNode: VNode, newVNode: VNode): void;
//# sourceMappingURL=renderer.d.ts.map