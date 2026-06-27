import { VNode } from './renderer';
import { createPortal } from './portal';

export interface TeleportProps {
  to: string | Element;
  children?: VNode;
}

export function Teleport(props: TeleportProps): VNode {
  if (!props.children) return { type: 'empty', props: {} };

  const target = typeof props.to === 'string'
    ? (typeof document !== 'undefined' ? (document.querySelector(props.to) || document.body) : null)
    : props.to;

  if (!target) return { type: 'empty', props: {} };
  return createPortal({ children: props.children, target });
}
