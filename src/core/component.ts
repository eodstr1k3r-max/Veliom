import { h, VNode, render, patch, removeVNode } from './renderer.js';
import {
  pushComponentContext,
  popComponentContext,
  runEffects,
  cleanupEffects,
  Context,
} from '../state/hooks.js';
import { pushLifecycleContext, popLifecycleContext, triggerOnMount, LifecycleCallbacks } from '../state/lifecycle.js';
import { reportError } from './error.js';

export interface ComponentProps {
  children?: VNode[];
  [key: string]: unknown;
}

export type ComponentRender<P = ComponentProps> = (props: P) => VNode | (() => VNode);

export function resolveRenderResult(
  result: VNode | (() => VNode)
): VNode {
  return typeof result === 'function' ? (result as () => VNode)() : result;
}

export interface Component<P = ComponentProps> {
  render: (props: P) => VNode;
}

export type ComponentInstance = {
  vnode: VNode | null;
  container: Element | null;
  component: Component<ComponentProps>;
  props: ComponentProps;
  context: Context;
  lifecycle: LifecycleCallbacks;
};

export function createComponent<P = ComponentProps>(
  renderFn: ComponentRender<P>
): Component<P> {
  return { render: renderFn as (props: P) => VNode };
}

const componentRoots = new WeakMap<Element, ComponentInstance>();

export function mount<P = ComponentProps>(
  component: Component<P> | ComponentRender<P>,
  container: Element,
  props: P = {} as P
): void {
  const comp = typeof component === 'function'
    ? createComponent(component as ComponentRender<P>)
    : component;

  const context = pushComponentContext();
  const lifecycle = pushLifecycleContext();

  let vnode: VNode;
  try {
    vnode = resolveRenderResult((comp.render as (props: ComponentProps) => VNode | (() => VNode))(props as unknown as ComponentProps));
  } catch (err) {
    reportError(err);
    vnode = { type: 'empty', props: {} };
  }
  render(vnode, container);

  const instance: ComponentInstance = {
    vnode,
    container,
    component: comp as Component<ComponentProps>,
    props: props as ComponentProps,
    context,
    lifecycle,
  };

  componentRoots.set(container, instance);
  triggerOnMount(lifecycle);

  popLifecycleContext();
  popComponentContext();
}

export function update<P = ComponentProps>(
  container: Element,
  newProps: Partial<P>
): void {
  const instance = componentRoots.get(container);
  if (!instance) {
    console.warn('Container is not a mounted component');
    return;
  }

  const prevProps = { ...instance.props };
  instance.props = { ...instance.props, ...newProps } as ComponentProps;

  pushComponentContext(instance.context);
  pushLifecycleContext(instance.lifecycle);

  let newVNode: VNode;
  try {
    newVNode = resolveRenderResult(instance.component.render(instance.props));
  } catch (err) {
    reportError(err);
    newVNode = { type: 'empty', props: {} };
  }
  if (instance.vnode) {
    patch(container, instance.vnode, newVNode);
  }
  instance.vnode = newVNode;

  popLifecycleContext();
  popComponentContext();

  runEffects(instance.context);
  if (instance.lifecycle.onUpdate) {
    instance.lifecycle.onUpdate(prevProps);
  }
}

export function unmount(container: Element): void {
  const instance = componentRoots.get(container);
  if (!instance) {
    console.warn('Container is not a mounted component');
    return;
  }

  cleanupEffects(instance.context);
  if (instance.lifecycle.onUnmount) {
    instance.lifecycle.onUnmount();
  }
  if (instance.vnode) {
    removeVNode(instance.vnode);
  }
  container.innerHTML = '';
  componentRoots.delete(container);
}

function shallowEqual(a: Record<string, unknown>, b: Record<string, unknown>): boolean {
  const keysA = Object.keys(a);
  const keysB = Object.keys(b);
  if (keysA.length !== keysB.length) return false;
  for (let i = 0; i < keysA.length; i++) {
    const key = keysA[i];
    if (key === 'children') continue;
    if (!Object.is(a[key], b[key])) return false;
  }
  return true;
}

export function memo<P = ComponentProps>(
  renderFn: ComponentRender<P>
): Component<P> {
  let lastProps: P | null = null;
  let lastVNode: VNode | null = null;

  const wrapped = (props: P) => {
    if (lastProps !== null && lastVNode !== null && shallowEqual(lastProps as any, props as any)) {
      return lastVNode;
    }
    lastProps = { ...props };
    lastVNode = resolveRenderResult(renderFn(props));
    return lastVNode;
  };

  return { render: wrapped as (props: P) => VNode };
}

export { h };
