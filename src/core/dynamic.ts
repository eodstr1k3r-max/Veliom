import { VNode, h } from './renderer';

export interface DynamicProps {
  component?: string | ((props: Record<string, unknown>) => VNode);
  children?: VNode | VNode[];
  [key: string]: unknown;
}

export function Dynamic(props: DynamicProps): VNode {
  const { component, children, ...rest } = props;

  if (!component) {
    return { type: 'empty', props: {} };
  }

  if (typeof component === 'string') {
    const childArr = children ? (Array.isArray(children) ? children : [children]) : [];
    return h(component, rest as Record<string, unknown>, ...childArr);
  }

  const renderProps = { ...rest, children: children ? (Array.isArray(children) ? children : [children]) : undefined };
  return component(renderProps);
}
