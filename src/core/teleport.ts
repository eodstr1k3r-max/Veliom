import { VNode } from './renderer.js';
import { createPortal } from './portal.js';

export interface TeleportProps {
  to: string | Element;
  children?: VNode;
}

export function Teleport(props: TeleportProps): VNode {
  if (!props.children) return { type: 'empty', props: {} };

  const target = typeof props.to === 'string'
    ? (typeof document !== 'undefined' ? (document.querySelector(props.to) || null) : null)
    : props.to;

  if (typeof document !== 'undefined' && typeof props.to === 'string' && !target) {
    console.warn(`Veliom: Teleport target "${props.to}" not found — rendering empty`);
  }

  if (!target) return { type: 'empty', props: {} };
  return createPortal({ children: props.children, target });
}
