import { h, render, patch } from './renderer';
import { pushComponentContext, popComponentContext, runEffects, cleanupEffects, } from '../state/hooks';
import { reportError } from './error';
let updateQueue = [];
let flushing = false;
function scheduleUpdate(instance) {
    if (!updateQueue.includes(instance)) {
        updateQueue.push(instance);
    }
    if (!flushing) {
        flushing = true;
        queueMicrotask(flushUpdates);
    }
}
function flushUpdates() {
    const queue = updateQueue;
    updateQueue = [];
    flushing = false;
    for (let i = 0; i < queue.length; i++) {
        const instance = queue[i];
        if (!instance.container)
            continue;
        try {
            const newVNode = instance.component.render(instance.props);
            if (instance.vnode) {
                patch(instance.container, instance.vnode, newVNode);
            }
            instance.vnode = newVNode;
        }
        catch (error) {
            reportError(error);
        }
    }
}
export function createComponent(renderFn) {
    return {
        render: (props) => {
            pushComponentContext();
            try {
                const vnode = renderFn(props);
                runEffects();
                return vnode;
            }
            catch (error) {
                reportError(error);
                return { type: 'empty', props: {} };
            }
            finally {
                popComponentContext();
            }
        },
    };
}
export function mount(component, container, props = {}) {
    const instance = {
        vnode: null,
        container,
        component: component,
        props: props,
    };
    try {
        const initialVNode = component.render(props);
        instance.vnode = initialVNode;
        render(initialVNode, container);
        componentInstances.set(container, instance);
    }
    catch (error) {
        reportError(error);
        render({ type: 'div', props: {}, children: [{ type: 'text', props: { value: 'Error rendering component' } }] }, container);
    }
}
const componentInstances = new WeakMap();
export function update(container, newProps) {
    const instance = componentInstances.get(container);
    if (!instance) {
        console.warn('Container is not a mounted component');
        return;
    }
    instance.props = { ...instance.props, ...newProps };
    scheduleUpdate(instance);
}
export function unmount(container) {
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
