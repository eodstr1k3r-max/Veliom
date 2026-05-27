export interface VNode {
  type: string;
  props: Record<string, unknown>;
  children?: VNode[];
  key?: string;
  ref?: Element;
}

const FRAGMENT = 'fragment';
const EMPTY = 'empty';
const PORTAL = 'portal';

export interface DOMNode {
  type: string;
  element: Element | Text;
  vnode: VNode;
}

import { longestIncreasingSubsequence } from '../utils/lis';

const nodePool: VNode[] = [];

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
  vnode.key = (props?.key as string) ?? undefined;

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
  if (!eventContainer || typeof handler !== 'function') return;

  if (key.startsWith('on')) {
    const eventName = key.slice(2).toLowerCase();
    const listener = handler as EventListener;

    if (!eventMap.has(eventName)) {
      eventMap.set(eventName, new Map());
      const container = eventContainer;
      const eventHandler = (e: Event) => {
        let node: Element | null = e.target as Element;
        while (node && node !== container) {
          const handlerMap = eventMap.get(e.type);
          if (handlerMap) {
            const elHandler = handlerMap.get(node);
            if (elHandler) {
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

function detachEvent(element: Element, key: string): void {
  if (key.startsWith('on')) {
    const eventName = key.slice(2).toLowerCase();
    const handlerMap = eventMap.get(eventName);
    if (handlerMap) {
      handlerMap.delete(element);
      if (handlerMap.size === 0 && eventContainer) {
        eventMap.delete(eventName);
      }
    }
  }
}

function detachAllEvents(element: Element): void {
  for (const [eventName, handlerMap] of eventMap) {
    handlerMap.delete(element);
    if (handlerMap.size === 0) {
      eventMap.delete(eventName);
    }
  }
}

function execRef(ref: unknown, el: Element | null): void {
  if (!ref) return;
  if (typeof ref === 'function') {
    ref(el);
  } else if (ref && typeof ref === 'object' && 'current' in (ref as Record<string, unknown>)) {
    (ref as { current: unknown }).current = el;
  }
}

const DANGEROUS_ATTRS = ['href', 'src', 'action', 'formAction', 'xlink:href'];
const JAVASCRIPT_PROTOCOLS = ['javascript:', 'data:', 'vbscript:'];

function isSafeAttribute(key: string, value: unknown): boolean {
  if (DANGEROUS_ATTRS.includes(key.toLowerCase())) {
    const strValue = String(value).toLowerCase().trim();
    for (const protocol of JAVASCRIPT_PROTOCOLS) {
      if (strValue.startsWith(protocol)) return false;
    }
  }
  return true;
}

const ATTR_ALIAS: Record<string, string> = {
  htmlFor: 'for',
  className: 'class',
  readOnly: 'readonly',
  autoFocus: 'autofocus',
  autoPlay: 'autoplay',
  tabIndex: 'tabindex',
  colSpan: 'colspan',
  rowSpan: 'rowspan',
  encType: 'enctype',
  formAction: 'formaction',
  httpEquiv: 'http-equiv',
  acceptCharset: 'accept-charset',
};

function resolveClass(value: unknown): string {
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return value.map(resolveClass).filter(Boolean).join(' ');
  if (value && typeof value === 'object') {
    return Object.entries(value)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(' ');
  }
  return '';
}

function setClass(element: Element, value: unknown): void {
  element.setAttribute('class', resolveClass(value));
}

function applyProps(element: Element, props: Record<string, unknown>): void {
  if (!props) return;
  const ref = 'ref' in props ? props.ref : undefined;

  for (const [key, value] of Object.entries(props)) {
    if (key === 'key' || key === 'children' || key === 'ref') continue;

    const attrKey = ATTR_ALIAS[key] ?? key;

    if (key === 'className' || key === 'classList') {
      setClass(element, value);
    } else if (key.startsWith('on')) {
      if (typeof value === 'function') {
        attachEvent(element, key, value);
      }
    } else if (key === 'style' && typeof value === 'object' && value !== null) {
      Object.assign((element as HTMLElement).style, value);
    } else if (key === 'dangerouslySetInnerHTML' && typeof value === 'object' && value !== null) {
      const html = (value as { __html: string }).__html;
      if (typeof html === 'string') {
        element.innerHTML = html;
      }
    } else if (key === 'value' && ('value' in element || element instanceof HTMLInputElement)) {
      (element as HTMLInputElement).value = String(value);
    } else if (key === 'checked' && element instanceof HTMLInputElement) {
      element.checked = Boolean(value);
    } else if (value !== null && value !== undefined) {
      if (!isSafeAttribute(attrKey, value)) {
        console.warn(`Veliom: Blocked dangerous attribute "${attrKey}"`);
        continue;
      }
      element.setAttribute(attrKey, String(value));
    }
  }

  if (ref) execRef(ref, element);
}

export function createElement(vnode: VNode, parent?: Element): Element | Text | Node[] {
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

  if (vnode.type === PORTAL) {
    const target = (vnode.props.target as Element) || document.body;
    if (vnode.children) {
      for (let i = 0; i < vnode.children.length; i++) {
        const child = vnode.children[i];
        if (child && child.type !== EMPTY) {
          const result = createElement(child, target);
          if (Array.isArray(result)) {
            for (let j = 0; j < result.length; j++) {
              target.appendChild(result[j]);
            }
          } else if (result) {
            target.appendChild(result);
          }
        }
      }
    }
    vnode.ref = target;
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

function removeVNode(vnode: VNode): void {
  if (vnode.ref) {
    detachAllEvents(vnode.ref as Element);
    execRef(vnode.props.ref, null);
  }
  if (vnode.children) {
    for (let i = 0; i < vnode.children.length; i++) {
      if (vnode.children[i]) removeVNode(vnode.children[i]);
    }
  }
}

const EMPTY_ARR: VNode[] = [];

function appendToParent(parent: Element, result: Element | Text | Node[], refNode?: Node | null): void {
  if (Array.isArray(result)) {
    for (let i = 0; i < result.length; i++) {
      parent.insertBefore(result[i], refNode ?? null);
    }
  } else if (result) {
    parent.insertBefore(result, refNode ?? null);
  }
}

function reconcile(
  parent: Element,
  oldChildren: VNode[],
  newChildren: VNode[],
  _oldKeyMap: Map<string | number, VNode>,
  newKeyMap: Map<string | number, VNode>,
): void {
  const oldLen = oldChildren.length;
  const newLen = newChildren.length;
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
    for (let i = newHead; i <= newTail; i++) {
      const refNode = newChildren[i + 1]?.ref ?? null;
      appendToParent(parent, createElement(newChildren[i]), refNode);
    }
    return;
  }

  if (newHead > newTail) {
    for (let i = oldHead; i <= oldTail; i++) {
      const v = oldChildren[i];
      if (v?.ref) {
        removeVNode(v);
        parent.removeChild(v.ref);
      }
    }
    return;
  }

  const oldByKey = new Map<string | number, { vnode: VNode; idx: number }>();
  for (let i = oldHead; i <= oldTail; i++) {
    const oldV = oldChildren[i];
    if (oldV) {
      oldByKey.set(oldV.key ?? i, { vnode: oldV, idx: i });
    }
  }

  for (let i = oldHead; i <= oldTail; i++) {
    const oldV = oldChildren[i];
    if (oldV && oldV.ref) {
      const key = oldV.key ?? i;
      if (!newKeyMap.has(key)) {
        removeVNode(oldV);
        parent.removeChild(oldV.ref);
      }
    }
  }

  const source: number[] = [];
  for (let i = newHead; i <= newTail; i++) {
    const newV = newChildren[i];
    if (!newV) continue;
    const key = newV.key ?? i;
    const existing = oldByKey.get(key);
    if (existing) {
      source.push(existing.idx);
    }
  }

  const lis = longestIncreasingSubsequence(source);
  const stable = new Set<number>();
  for (let i = 0; i < lis.length; i++) {
    stable.add(newHead + lis[i]);
  }

  for (let i = newTail; i >= newHead; i--) {
    const newV = newChildren[i];
    if (!newV) continue;
    const key = newV.key ?? i;
    const existing = oldByKey.get(key);
    if (existing) {
      patchVNode(parent, existing.vnode, newV, existing.idx);
      newV.ref = existing.vnode.ref;
      if (!stable.has(i)) {
        const nextSibling = newChildren[i + 1]?.ref ?? null;
        const domNode = newV.ref;
        if (domNode && domNode.parentNode && domNode.nextSibling !== nextSibling) {
          parent.insertBefore(domNode, nextSibling);
        }
      }
    } else {
      const nextSibling = newChildren[i + 1]?.ref ?? null;
      appendToParent(parent, createElement(newV), nextSibling);
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
    if (oldVNode.ref) removeVNode(oldVNode);
    if (Array.isArray(newEl)) {
      parent.replaceChild(newEl[0] || document.createTextNode(''), oldEl);
    } else {
      parent.replaceChild(newEl, oldEl);
    }
    newVNode.ref = (Array.isArray(newEl) ? newEl[0] : newEl) as Element;
    return;
  }

  const el = existingElement as Element;
  const oldKeys = Object.keys(oldVNode.props);
  const newKeys = new Set(Object.keys(newVNode.props));

  for (let i = 0; i < oldKeys.length; i++) {
    const key = oldKeys[i];
    if (!newKeys.has(key) && key !== 'key' && key !== 'children' && key !== 'ref') {
      if (key.startsWith('on')) {
        detachEvent(el, key);
      }
      const attrKey = ATTR_ALIAS[key] ?? key;
      if (key === 'className' || key === 'classList') {
        el.removeAttribute('class');
      } else if (key === 'value' && ('value' in el || el instanceof HTMLInputElement)) {
        (el as HTMLInputElement).value = '';
      } else if (key === 'checked' && el instanceof HTMLInputElement) {
        el.checked = false;
      } else if (key !== 'style' && key !== 'dangerouslySetInnerHTML') {
        el.removeAttribute(attrKey);
      }
    }
  }

  const newRef = 'ref' in newVNode.props ? newVNode.props.ref : undefined;
  const oldRef = 'ref' in oldVNode.props ? oldVNode.props.ref : undefined;
  if (newRef !== oldRef) {
    execRef(oldRef, null);
    execRef(newRef, el);
  }

  for (const key of newKeys) {
    if (key === 'key' || key === 'children' || key === 'ref') continue;
    const oldVal = oldVNode.props[key];
    const newVal = newVNode.props[key];
    if (oldVal !== newVal) {
      const attrKey = ATTR_ALIAS[key] ?? key;

      if (key === 'className' || key === 'classList') {
        setClass(el, newVal);
      } else if (key === 'style' && typeof newVal === 'object' && newVal !== null) {
        Object.assign((el as HTMLElement).style, newVal);
      } else if (key === 'dangerouslySetInnerHTML' && typeof newVal === 'object' && newVal !== null) {
        const html = (newVal as { __html: string }).__html;
        if (typeof html === 'string') el.innerHTML = html;
      } else if (key === 'value' && ('value' in el || el instanceof HTMLInputElement)) {
        (el as HTMLInputElement).value = String(newVal);
      } else if (key === 'checked' && el instanceof HTMLInputElement) {
        el.checked = Boolean(newVal);
      } else if (key.startsWith('on') && typeof newVal === 'function') {
        attachEvent(el, key, newVal);
      } else if (key.startsWith('on')) {
        detachEvent(el, key);
      } else if (newVal === null || newVal === undefined) {
        el.removeAttribute(attrKey);
      } else if (isSafeAttribute(attrKey, newVal)) {
        el.setAttribute(attrKey, String(newVal));
      } else {
        console.warn(`Veliom: Blocked dangerous attribute "${attrKey}"`);
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
    reconcile(container, oldChildren, newChildren, buildKeyMap(oldChildren), buildKeyMap(newChildren));
    return;
  }
  patchVNode(container, oldVNode, newVNode, 0);
}
