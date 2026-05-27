import { VNode } from './renderer';

export interface TransitionProps {
  show: boolean;
  name: string;
  children: VNode;
  appear?: boolean;
}

export function Transition(props: TransitionProps): VNode {
  const { show, name, children } = props;
  const baseClass = name;

  if (!show) {
    return { type: 'empty', props: {} };
  }

  const existing = children;
  const el = existing.ref;
  if (el) {
    const el2 = el as HTMLElement;
    el2.classList.add(`${baseClass}-enter-from`, `${baseClass}-enter-active`);
    requestAnimationFrame(() => {
      el2.classList.remove(`${baseClass}-enter-from`);
      el2.classList.add(`${baseClass}-enter-to`);
      const onEnd = () => {
        el2.classList.remove(`${baseClass}-enter-active`, `${baseClass}-enter-to`);
        el2.removeEventListener('transitionend', onEnd);
      };
      el2.addEventListener('transitionend', onEnd);
    });
  }

  return children;
}

export function createTransitionClasses(
  el: HTMLElement,
  baseClass: string,
  onDone?: () => void
): void {
  el.classList.add(`${baseClass}-enter-from`, `${baseClass}-enter-active`);
  requestAnimationFrame(() => {
    el.classList.remove(`${baseClass}-enter-from`);
    el.classList.add(`${baseClass}-enter-to`);
    const onEnd = () => {
      el.classList.remove(`${baseClass}-enter-active`, `${baseClass}-enter-to`);
      el.removeEventListener('transitionend', onEnd);
      onDone?.();
    };
    el.addEventListener('transitionend', onEnd);
  });
}

export function leaveTransition(
  el: HTMLElement,
  baseClass: string,
  onDone?: () => void
): void {
  el.classList.add(`${baseClass}-leave-from`, `${baseClass}-leave-active`);
  requestAnimationFrame(() => {
    el.classList.remove(`${baseClass}-leave-from`);
    el.classList.add(`${baseClass}-leave-to`);
    const onEnd = () => {
      el.classList.remove(`${baseClass}-leave-active`, `${baseClass}-leave-to`);
      el.removeEventListener('transitionend', onEnd);
      onDone?.();
    };
    el.addEventListener('transitionend', onEnd);
  });
}
