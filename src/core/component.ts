import { h, VNode, render, patch } from './renderer';
import {
  pushComponentContext,
  popComponentContext,
  runEffects,
  cleanupEffects,
} from '../state/hooks';
import { reportError } from './error';

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

let updateQueue: ComponentInstance[] = [];
let flushing = false;

function scheduleUpdate(instance: ComponentInstance): void {
  if (!updateQueue.includes(instance)) {
    updateQueue.push(instance);
  }
  if (!flushing) {
    flushing = true;
    queueMicrotask(flushUpdates);
  }
}

function flushUpdates(): void {
  const queue = updateQueue;
  updateQueue = [];
  flushing = false;

  for (let i = 0; i < queue.length; i++) {
    const instance = queue[i];
    if (!instance.container) continue;

    try {
      const newVNode = instance.component.render(instance.props);
      if (instance.vnode) {
        patch(instance.container, instance.vnode, newVNode);
      }
      instance.vnode = newVNode;
    } catch (error) {
      reportError(error);
    }
  }
}

export function createComponent<P = ComponentProps>(
  renderFn: ComponentRender<P>
): Component<P> {
  return {
    render: (props: P) => {
      pushComponentContext();
      try {
        const vnode = renderFn(props);
        runEffects();
        return vnode;
      } catch (error) {
        reportError(error);
        return { type: 'empty', props: {} };
      } finally {
        popComponentContext();
      }
    },
  };
}

export function mount<P = ComponentProps>(
  component: Component<P>,
  container: Element,
  props: P = {} as P
): void {
  const instance: ComponentInstance = {
    vnode: null,
    container,
    component: component as Component<ComponentProps>,
    props: props as ComponentProps,
  };

  try {
    const initialVNode = component.render(props as P);
    instance.vnode = initialVNode;
    render(initialVNode, container);
    componentInstances.set(container, instance);
  } catch (error) {
    reportError(error);
    render({ type: 'div', props: {}, children: [{ type: 'text', props: { value: 'Error rendering component' } }] }, container);
  }
}

const componentInstances = new WeakMap<Element, ComponentInstance>();

export function update<P = ComponentProps>(
  container: Element,
  newProps: Partial<P>
): void {
  const instance = componentInstances.get(container) as ComponentInstance | undefined;

  if (!instance) {
    console.warn('Container is not a mounted component');
    return;
  }

  instance.props = { ...instance.props, ...newProps } as ComponentProps;
  scheduleUpdate(instance);
}

export function unmount(container: Element): void {
  if (!componentInstances.has(container)) {
    console.warn('Container is not a mounted component');
    return;
  }

  cleanupEffects();

  const instance = componentInstances.get(container);
  if (instance?.container) {
    instance.container.innerHTML = '';
  }
  componentInstances.delete(container);
}

export { h };
