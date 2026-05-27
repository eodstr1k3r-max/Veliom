import { VNode } from './renderer';
import { createPortal } from './portal';

export interface TeleportProps {
  to: string | Element;
  children?: VNode;
}

export function Teleport(props: TeleportProps): VNode {
  const target = typeof props.to === 'string'
    ? document.querySelector(props.to) || document.body
    : props.to;

  if (!props.children) return { type: 'empty', props: {} };
  return createPortal({ children: props.children, target });
}
