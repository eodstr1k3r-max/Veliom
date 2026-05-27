import { VNode } from './renderer';

let portalContainer: Element | null = null;

export function setPortalContainer(container: Element): void {
  portalContainer = container;
}

export interface PortalProps {
  children: VNode;
  target?: Element;
}

export function createPortal(props: PortalProps): VNode {
  const target = props.target || portalContainer || document.body;

  return {
    type: 'portal',
    props: {
      ...props,
      target,
    },
    children: props.children ? [props.children] : undefined,
  };
}
