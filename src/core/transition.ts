import { VNode } from './renderer';

const TRANSITION_TIMEOUT = 500;

export interface TransitionProps {
  show: boolean;
  name: string;
  children: VNode;
}

function onTransitionEnd(el: HTMLElement, removeClasses: string[], onDone?: () => void): void {
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    el.classList.remove(...removeClasses);
    el.removeEventListener('transitionend', finish);
    clearTimeout(fallbackTimer);
    onDone?.();
  };
  const fallbackTimer = setTimeout(finish, TRANSITION_TIMEOUT);
  el.addEventListener('transitionend', finish);
  el.addEventListener('transitioncancel', finish);
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
      onTransitionEnd(el2, [`${baseClass}-enter-active`, `${baseClass}-enter-to`]);
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
    onTransitionEnd(el, [`${baseClass}-enter-active`, `${baseClass}-enter-to`], onDone);
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
    onTransitionEnd(el, [`${baseClass}-leave-active`, `${baseClass}-leave-to`], onDone);
  });
}
