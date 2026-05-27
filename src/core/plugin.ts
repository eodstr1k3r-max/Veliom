import { VNode } from './renderer';

export interface PluginHooks {
  beforeCreate?: (vnode: VNode) => void;
  created?: (vnode: VNode) => void;
  beforeMount?: (vnode: VNode) => void;
  mounted?: (vnode: VNode) => void;
  beforeUpdate?: (oldVNode: VNode, newVNode: VNode) => void;
  updated?: (oldVNode: VNode, newVNode: VNode) => void;
  beforeUnmount?: (vnode: VNode) => void;
  unmounted?: (vnode: VNode) => void;
}

export interface Plugin {
  name: string;
  hooks: PluginHooks;
}

const plugins: Plugin[] = [];

export function usePlugin(plugin: Plugin): void {
  plugins.push(plugin);
}

export function getPlugins(): Plugin[] {
  return plugins;
}

function runHooks(hookName: keyof PluginHooks, ...args: unknown[]): void {
  for (let i = 0; i < plugins.length; i++) {
    const hook = plugins[i].hooks[hookName];
    if (hook) {
      (hook as (...a: unknown[]) => void)(...args);
    }
  }
}

export const pluginRunner = {
  beforeCreate: (v: VNode) => runHooks('beforeCreate', v),
  created: (v: VNode) => runHooks('created', v),
  beforeMount: (v: VNode) => runHooks('beforeMount', v),
  mounted: (v: VNode) => runHooks('mounted', v),
  beforeUpdate: (o: VNode, n: VNode) => runHooks('beforeUpdate', o, n),
  updated: (o: VNode, n: VNode) => runHooks('updated', o, n),
  beforeUnmount: (v: VNode) => runHooks('beforeUnmount', v),
  unmounted: (v: VNode) => runHooks('unmounted', v),
};
