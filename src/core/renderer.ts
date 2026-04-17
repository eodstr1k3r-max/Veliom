export interface VNode {
  type: string;
  props: Record<string, unknown>;
  children?: VNode[];
  key?: string;
  ref?: Element;
}

const FRAGMENT = 'fragment';
const EMPTY = 'empty';

export interface DOMNode {
  type: string;
  element: Element | Text;
  vnode: VNode;
}

const nodePool: VNode[] = [];
const MAX_POOL_SIZE = 1000;

function poolVNode(vnode: VNode): void {
  if (nodePool.length < MAX_POOL_SIZE) {
    vnode.children = undefined;
    vnode.props = {};
    nodePool.push(vnode);
  }
}

function getVNode(): VNode {
  return nodePool.pop() || { type: '', props: {} };
}

export function h(
  type: string,
  props: Record<string, unknown> | null = {},
  ...children: (VNode | string | number | null | undefined)[]
): VNode {
  const vnode = getVNode();
  vnode.type = type;
  vnode.props = props || {};
  vnode.key = props?.key as string | undefined;

  const filteredChildren = children.filter(
    (c) => c !== null && c !== undefined && c !== ''
  );

  if (filteredChildren.length > 0) {
    const flatChildren: VNode[] = [];
    for (let i = 0; i < filteredChildren.length; i++) {
      const child = filteredChildren[i];
      if (typeof child === 'string' || typeof child === 'number') {
        flatChildren.push({ type: 'text', props: { value: child } });
      } else if (typeof child === 'object' && child !== null) {
        flatChildren.push(child);
      }
    }
    vnode.children = flatChildren;
  }

  return vnode;
}

let eventContainer: Element | null = null;
const eventMap = new Map<string, Map<Element, EventListener>>();

export function setEventContainer(container: Element): void {
  eventContainer = container;
}

function attachEvent(element: Element, key: string, handler: unknown): void {
  if (!eventContainer) return;
  
  if (key.startsWith('on')) {
    const eventName = key.slice(2).toLowerCase();
    const listener = handler as EventListener;
    
    if (!eventMap.has(eventName)) {
      eventMap.set(eventName, new Map());
      const container = eventContainer;
      const eventHandler = (e: Event) => {
        const target = e.target as Element;
        let node: Element | null = target;
        while (node && node !== container) {
          const handlerMap = eventMap.get(e.type);
          if (handlerMap) {
            const elHandler = handlerMap.get(node);
            if (elHandler) {
              e.preventDefault();
              e.stopPropagation();
              elHandler(e);
              return;
            }
          }
          node = node.parentElement;
        }
      };
      container.addEventListener(eventName, eventHandler);
    }
    
    eventMap.get(eventName)!.set(element, listener);
  }
}

const DANGEROUS_ATTRS = ['href', 'src', 'action', 'formAction', 'xlink:href'];
const JAVASCRIPT_PROTOCOLS = ['javascript:', 'data:', 'vbscript:'];

function isSafeAttribute(key: string, value: unknown): boolean {
  if (DANGEROUS_ATTRS.includes(key.toLowerCase())) {
    const strValue = String(value).toLowerCase().trim();
    for (const protocol of JAVASCRIPT_PROTOCOLS) {
      if (strValue.startsWith(protocol)) {
        return false;
      }
    }
  }
  return true;
}

function applyProps(element: Element, props: Record<string, unknown>): void {
  if (!props) return;
  for (const [key, value] of Object.entries(props)) {
    if (key === 'key' || key === 'children' || key === 'ref') continue;
    
    if (key === 'className') {
      element.setAttribute('class', String(value));
    } else if (key.startsWith('on') && typeof value === 'function') {
      attachEvent(element, key, value);
    } else if (key === 'style' && typeof value === 'object') {
      Object.assign((element as HTMLElement).style, value);
    } else if (value !== null && value !== undefined) {
      if (!isSafeAttribute(key, value)) {
        console.warn(`Veliom: Blocked potentially dangerous attribute "${key}" with value "${value}"`);
        continue;
      }
      element.setAttribute(key, String(value));
    }
  }
}

function createElement(vnode: VNode, parent?: Element): Element | Text | Node[] {
  if (vnode.type === 'text') {
    return document.createTextNode(String(vnode.props.value));
  }

  if (vnode.type === FRAGMENT) {
    const nodes: Node[] = [];
    if (vnode.children) {
      for (let i = 0; i < vnode.children.length; i++) {
        const child = vnode.children[i];
        if (child && child.type !== EMPTY) {
          const result = createElement(child, parent);
          if (Array.isArray(result)) {
            nodes.push(...result);
          } else if (result) {
            nodes.push(result);
          }
        }
      }
    }
    return nodes;
  }

  if (vnode.type === EMPTY) {
    return [];
  }

  const element = document.createElement(vnode.type);
  applyProps(element, vnode.props);

  if (vnode.children) {
    for (let i = 0; i < vnode.children.length; i++) {
      const child = vnode.children[i];
      if (child && child.type !== EMPTY) {
        const result = createElement(child, element);
        if (Array.isArray(result)) {
          for (let j = 0; j < result.length; j++) {
            element.appendChild(result[j]);
          }
        } else if (result) {
          element.appendChild(result);
        }
      }
    }
  }

  vnode.ref = element;
  return element;
}

const EMPTY_ARR: VNode[] = [];

function appendToParent(parent: Element, result: Element | Text | Node[], refNode?: Node | null): void {
  if (Array.isArray(result)) {
    let ref: Node | null = refNode ?? null;
    for (let i = 0; i < result.length; i++) {
      parent.insertBefore(result[i], ref);
    }
  } else if (result) {
    parent.insertBefore(result, refNode ?? null);
  }
}

function reconcile(
  parent: Element,
  oldChildren: VNode[],
  newChildren: VNode[],
  oldKeyMap: Map<string | number, VNode>,
  newKeyMap: Map<string | number, VNode>,
  pools: { oldPool: VNode[]; newPool: VNode[] }
): void {
  const oldLen = oldChildren.length;
  const newLen = newChildren.length;
  const maxLen = Math.max(oldLen, newLen);

  let oldHead = 0;
  let oldTail = oldLen - 1;
  let newHead = 0;
  let newTail = newLen - 1;

  while (oldHead <= oldTail && newHead <= newTail) {
    const oldV = oldChildren[oldHead];
    const newV = newChildren[newHead];

    if (!oldV) { oldHead++; continue; }
    if (!newV) { newHead++; continue; }

    if (oldV.key === newV.key) {
      patchVNode(parent, oldV, newV, oldHead);
      oldHead++;
      newHead++;
    } else break;
  }

  while (oldHead <= oldTail && newHead <= newTail) {
    const oldV = oldChildren[oldTail];
    const newV = newChildren[newTail];

    if (!oldV) { oldTail--; continue; }
    if (!newV) { newTail--; continue; }

    if (oldV.key === newV.key) {
      patchVNode(parent, oldV, newV, oldTail);
      oldTail--;
      newTail--;
    } else break;
  }

  if (oldHead > oldTail) {
    while (newHead <= newTail) {
      const idx = newTail;
      const refNode = newChildren[idx] ? (newChildren[idx - 1]?.ref?.nextSibling as Node) : null;
      appendToParent(parent, createElement(newChildren[newHead]), refNode);
      newHead++;
    }
  } else if (newHead > newTail) {
    while (oldHead <= oldTail) {
      const v = oldChildren[oldHead++];
      if (v?.ref) parent.removeChild(v.ref);
    }
  } else {
    const keyMoves = new Map<number, number>();
    
    for (let i = newHead; i <= newTail; i++) {
      const key = newChildren[i]?.key ?? i;
      keyMoves.set(i, oldKeyMap.has(key) ? oldChildren.indexOf(oldKeyMap.get(key)!) : -1);
    }

    for (let i = newHead; i <= newTail; i++) {
      const key = newChildren[i]?.key ?? i;
      const oldIdx = keyMoves.get(i) ?? -1;
      
      if (oldIdx === -1) {
        const refNode = parent.childNodes[newHead - 1]?.nextSibling;
        appendToParent(parent, createElement(newChildren[i]), refNode);
      } else {
        patchVNode(parent, oldChildren[oldIdx], newChildren[i], oldIdx);
      }
    }

    for (let i = oldHead; i <= oldTail; i++) {
      const key = oldChildren[i]?.key ?? i;
      const ref = oldChildren[i]?.ref;
      if (!newKeyMap.has(key) && ref) {
        parent.removeChild(ref);
      }
    }
  }
}

function patchVNode(
  parent: Element,
  oldVNode: VNode,
  newVNode: VNode,
  _index: number
): void {
  if (oldVNode === newVNode) return;

  const existingElement = oldVNode.ref ?? (parent.childNodes[_index] as Element | Text | undefined);
  
  if (!existingElement) {
    const newEl = createElement(newVNode);
    if (Array.isArray(newEl)) {
      for (let i = 0; i < newEl.length; i++) {
        parent.appendChild(newEl[i]);
      }
    } else if (newEl) {
      parent.appendChild(newEl);
    }
    if (newEl && !Array.isArray(newEl)) {
      newVNode.ref = newEl as Element;
    }
    return;
  }

  if (newVNode.type === 'text') {
    if (oldVNode.props.value !== newVNode.props.value) {
      (existingElement as Text).data = String(newVNode.props.value);
    }
    newVNode.ref = existingElement as Element;
    return;
  }

  if (oldVNode.type !== newVNode.type) {
    const newEl = createElement(newVNode);
    const oldEl = oldVNode.ref ? oldVNode.ref : (parent.childNodes[_index] as Node);
    if (Array.isArray(newEl)) {
      parent.replaceChild(newEl[0] || document.createTextNode(''), oldEl);
    } else {
      parent.replaceChild(newEl, oldEl);
    }
    newVNode.ref = (Array.isArray(newEl) ? newEl[0] : newEl) as Element;
    return;
  }

  const el = existingElement as Element;
  const oldKeys = new Set(Object.keys(oldVNode.props));
  const newKeys = new Set(Object.keys(newVNode.props));

  for (const key of oldKeys) {
    if (!newKeys.has(key) && key !== 'key' && key !== 'children' && key !== 'ref') {
      if (key === 'className') {
        el.removeAttribute('class');
      } else {
        el.removeAttribute(key);
      }
    }
  }

  for (const key of newKeys) {
    if (key === 'key' || key === 'children' || key === 'ref') continue;
    const oldVal = oldVNode.props[key];
    const newVal = newVNode.props[key];
    if (oldVal !== newVal) {
      if (key === 'className') {
        el.setAttribute('class', String(newVal));
      } else if (key === 'style' && typeof newVal === 'object') {
        Object.assign((el as HTMLElement).style, newVal);
      } else if (!key.startsWith('on') || typeof newVal !== 'function') {
        if (newVal === null || newVal === undefined) {
          el.removeAttribute(key);
        } else {
          el.setAttribute(key, String(newVal));
        }
      } else {
        attachEvent(el, key, newVal);
      }
    }
  }

  newVNode.ref = el;

  reconcile(
    el,
    oldVNode.children || EMPTY_ARR,
    newVNode.children || EMPTY_ARR,
    buildKeyMap(oldVNode.children || EMPTY_ARR),
    buildKeyMap(newVNode.children || EMPTY_ARR),
    { oldPool: [], newPool: [] }
  );
}

function buildKeyMap(children: VNode[]): Map<string | number, VNode> {
  const map = new Map<string | number, VNode>();
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child) {
      map.set(child.key ?? i, child);
    }
  }
  return map;
}

export function render(vnode: VNode, container: Element): void {
  setEventContainer(container);
  container.innerHTML = '';
  const result = createElement(vnode);
  if (Array.isArray(result)) {
    for (let i = 0; i < result.length; i++) {
      container.appendChild(result[i]);
    }
  } else if (result) {
    container.appendChild(result);
  }
}

export function patch(container: Element, oldVNode: VNode, newVNode: VNode): void {
  if (oldVNode.type === FRAGMENT || newVNode.type === FRAGMENT) {
    const oldChildren = oldVNode.type === FRAGMENT ? (oldVNode.children || []) : [oldVNode];
    const newChildren = newVNode.type === FRAGMENT ? (newVNode.children || []) : [newVNode];
    reconcile(container, oldChildren, newChildren, buildKeyMap(oldChildren), buildKeyMap(newChildren), { oldPool: [], newPool: [] });
    return;
  }
  patchVNode(container, oldVNode, newVNode, 0);
}
