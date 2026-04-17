import { VNode } from './renderer';
export declare function setPortalContainer(container: Element): void;
export interface PortalProps {
    children: VNode;
    target?: Element;
}
export declare function createPortal(props: PortalProps): VNode;
export declare function renderPortal(vnode: VNode, container: Element): void;
//# sourceMappingURL=portal.d.ts.map