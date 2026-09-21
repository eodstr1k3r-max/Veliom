export interface VNode {
  type: string;
  props: Record<string, unknown>;
  children?: VNode[];
  key?: string;
  ref?: Element | Text;
}

const FRAGMENT = 'fragment';
const EMPTY = 'empty';
const PORTAL = 'portal';

export interface DOMNode {
  type: string;
  element: Element | Text;
  vnode: VNode;
}

import { longestIncreasingSubsequence } from '../utils/lis.js';
import { sanitizeHtml } from '../utils/sanitize.js';
import { pluginRunner } from './plugin.js';

export function h(
  type: string,
  props: Record<string, unknown> | null = {},
  ...children: (VNode | string | number | null | undefined)[]
): VNode {
  // Note: `null`, `undefined` and `''` children are dropped; `false` is not
  // part of the child type. `0` is kept as a text node.
  const vnode: VNode = { type: '', props: {} };
  vnode.type = type;
  vnode.props = props || {};
  vnode.key = (props?.key as string) ?? undefined;

  const flatChildren: VNode[] = [];
  const pushChild = (c: VNode | string | number | null | undefined | unknown): void => {
    if (c === null || c === undefined || c === '') return;
    // React-style: nested arrays (e.g. `items.map(...)` without spread) are
    // flattened instead of becoming corrupt `<undefined>` elements.
    if (Array.isArray(c)) {
      for (let j = 0; j < c.length; j++) pushChild(c[j]);
      return;
    }
    if (typeof c === 'string' || typeof c === 'number') {
      flatChildren.push({ type: 'text', props: { value: c } });
    } else if (typeof c === 'object' && c !== null) {
      flatChildren.push(c as VNode);
    }
  };
  for (let i = 0; i < children.length; i++) {
    pushChild(children[i]);
  }
  if (flatChildren.length > 0) {
    vnode.children = flatChildren;
  }

  return vnode;
}

let eventContainer: Element | null = null;
const eventMap = new Map<string, Map<Element, EventListener>>();
const containerListeners = new Map<string, { root: Element | Document; handler: EventListener }>();

// Delegation root: document when available so portal content (mounted outside
// the render container) receives events too; falls back to the container
// (e.g. non-DOM runtimes exposing Elements without a document).
function getDelegationRoot(): Element | Document | null {
  if (typeof document !== 'undefined') return document;
  return eventContainer;
}

function clearDelegation(): void {
  for (const [eventName, entry] of containerListeners) {
    entry.root.removeEventListener(eventName, entry.handler);
  }
  containerListeners.clear();
  eventMap.clear();
}

export function setEventContainer(container: Element): void {
  if (eventContainer && eventContainer !== container) {
    clearDelegation();
  }
  eventContainer = container;
}

function ensureDelegatedListener(eventName: string): void {
  if (containerListeners.has(eventName)) return;
  const root = getDelegationRoot();
  if (!root) return;
  const eventHandler = (e: Event) => {
    let node: Element | null = e.target as Element;
    while (node) {
      const elHandler = eventMap.get(e.type)?.get(node);
      if (elHandler) elHandler(e);
      node = node.parentElement;
    }
  };
  root.addEventListener(eventName, eventHandler);
  containerListeners.set(eventName, { root, handler: eventHandler });
}

function attachEvent(element: Element, key: string, handler: unknown): void {
  if (typeof handler !== 'function') return;
  if (typeof document === 'undefined' && !eventContainer) return;

  if (key.startsWith('on')) {
    const eventName = key.slice(2).toLowerCase();
    if (!eventMap.has(eventName)) {
      eventMap.set(eventName, new Map());
    }
    ensureDelegatedListener(eventName);
    eventMap.get(eventName)!.set(element, handler as EventListener);
  }
}

function removeDelegatedListener(eventName: string): void {
  const entry = containerListeners.get(eventName);
  if (entry) {
    entry.root.removeEventListener(eventName, entry.handler);
    containerListeners.delete(eventName);
  }
}

function detachEvent(element: Element, key: string): void {
  if (key.startsWith('on')) {
    const eventName = key.slice(2).toLowerCase();
    const handlerMap = eventMap.get(eventName);
    if (handlerMap) {
      handlerMap.delete(element);
      if (handlerMap.size === 0) {
        eventMap.delete(eventName);
        removeDelegatedListener(eventName);
      }
    }
  }
}

function detachAllEvents(element: Element): void {
  for (const [eventName, handlerMap] of eventMap) {
    handlerMap.delete(element);
    if (handlerMap.size === 0) {
      eventMap.delete(eventName);
      removeDelegatedListener(eventName);
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

const DANGEROUS_ATTRS = ['href', 'src', 'action', 'formaction', 'xlink:href'];
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

function normalizeStyleKey(key: string): string {
  if (key.startsWith('--')) return key;
  return key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
}

function applyStyleValue(el: HTMLElement, key: string, value: unknown): void {
  const cssKey = normalizeStyleKey(key);
  if (value === null || value === undefined || value === false) {
    el.style.removeProperty(cssKey);
  } else {
    el.style.setProperty(cssKey, String(value));
  }
}

function removeStyleKeys(el: HTMLElement, oldStyle: Record<string, unknown>, newStyle?: Record<string, unknown>): void {
  const newKeys = new Set(Object.keys(newStyle ?? {}));
  for (const key of Object.keys(oldStyle)) {
    if (!newKeys.has(key)) {
      // Both: IDL assignment clears shorthands (background, font, ...) reliably,
      // removeProperty covers hyphenated keys and custom properties (--x).
      (el.style as unknown as Record<string, string>)[key] = '';
      el.style.removeProperty(normalizeStyleKey(key));
    }
  }
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
      } else if (value != null) {
        console.warn(`Veliom: Ignoring non-function event handler for "${key}"`);
      }
    } else if (key === 'style' && typeof value === 'object' && value !== null) {
      const styleObj = value as Record<string, unknown>;
      for (const styleKey of Object.keys(styleObj)) {
        applyStyleValue(element as HTMLElement, styleKey, styleObj[styleKey]);
      }
    } else if (key === 'dangerouslySetInnerHTML' && typeof value === 'object' && value !== null) {
      const html = (value as { __html: string }).__html;
      if (typeof html === 'string') {
        console.warn('Veliom: dangerouslySetInnerHTML used — ensure content is trusted');
        element.innerHTML = sanitizeHtml(html);
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
  pluginRunner.beforeCreate(vnode);

  if (vnode.type === 'text') {
    const textNode = document.createTextNode(String(vnode.props.value));
    vnode.ref = textNode;
    return textNode;
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
    const target = (vnode.props.target as Element) || (typeof document !== 'undefined' ? document.body : null);
    if (!target || !vnode.children) return [];
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
  pluginRunner.created(vnode);
  return element;
}

export function removeVNode(vnode: VNode): void {
  pluginRunner.beforeUnmount(vnode);
  if (vnode.ref && vnode.type !== PORTAL) {
    // Portal refs are mount targets (e.g. document.body) — never detach
    // listeners from those; the recursion below cleans up the children.
    detachAllEvents(vnode.ref as Element);
    execRef(vnode.props.ref, null);
  } else if (vnode.ref) {
    execRef(vnode.props.ref, null);
  }
  if (vnode.children) {
    // Guard against non-array children (defensive: Fragment normalizes, but
    // user-built VNodes may carry a single child).
    const children = Array.isArray(vnode.children) ? vnode.children : [vnode.children];
    for (let i = 0; i < children.length; i++) {
      if (children[i]) removeVNode(children[i]);
    }
  }
  pluginRunner.unmounted(vnode);
}

// Removes descendant DOM of portal/fragment VNodes from wherever they live
// (portal targets or the parent). Guarded — already-detached nodes are skipped.
function removeNestedDom(vnode: VNode): void {
  const children = vnode.children
    ? (Array.isArray(vnode.children) ? vnode.children : [vnode.children])
    : EMPTY_ARR;
  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (!child) continue;
    if (child.type === PORTAL || child.type === FRAGMENT) {
      removeNestedDom(child);
      continue;
    }
    if (child.ref?.parentNode) child.ref.parentNode.removeChild(child.ref);
    removeNestedDom(child);
  }
}

// Full teardown of one child VNode: listeners/hooks via removeVNode plus DOM
// removal that is correct for elements, text, fragments (no own ref) and
// portals (DOM lives in the target, never in `parent`).
function removeChildTree(parent: Element, vnode: VNode): void {
  removeVNode(vnode);
  if (vnode.type === PORTAL || vnode.type === FRAGMENT) {
    removeNestedDom(vnode);
    return;
  }
  const ref = vnode.ref;
  if (ref?.parentNode) {
    ref.parentNode.removeChild(ref);
  } else if (ref) {
    parent.removeChild(ref);
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
      if (v) removeChildTree(parent, v);
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
    if (oldV) {
      const key = oldV.key ?? i;
      if (!newKeyMap.has(key)) {
        removeChildTree(parent, oldV);
      }
    }
  }

  const source: number[] = [];
  const sourceNewPos: number[] = [];
  for (let i = newHead; i <= newTail; i++) {
    const newV = newChildren[i];
    if (!newV) continue;
    const key = newV.key ?? i;
    const existing = oldByKey.get(key);
    if (existing) {
      source.push(existing.idx);
      sourceNewPos.push(i);
    }
  }

  const lis = longestIncreasingSubsequence(source);
  const stable = new Set<number>();
  for (let i = 0; i < lis.length; i++) {
    stable.add(sourceNewPos[lis[i]]);
  }

  for (let i = newTail; i >= newHead; i--) {
    const newV = newChildren[i];
    if (!newV) continue;
    const key = newV.key ?? i;
    const existing = oldByKey.get(key);
    if (existing) {
      patchVNode(parent, existing.vnode, newV, existing.idx);
      // patchVNode sets newV.ref itself (incl. portal targets); only fall
      // back to the old ref when it didn't (e.g. empty fragment results).
      if (!newV.ref) newV.ref = existing.vnode.ref;
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
  pluginRunner.beforeUpdate(oldVNode, newVNode);

  // Portals render into their own target, not `parent` — reconciling them as
  // regular children corrupts both trees. Tear down the old side (portal
  // children are removed from their target, replaced elements from `parent`)
  // and mount the new one.
  if (oldVNode.type === PORTAL || newVNode.type === PORTAL) {
    removeVNode(oldVNode);
    if (oldVNode.type === PORTAL) {
      removeNestedDom(oldVNode);
    } else if (oldVNode.ref?.parentNode) {
      oldVNode.ref.parentNode.removeChild(oldVNode.ref);
    }
    const result = createElement(newVNode);
    // createElement(portal) appends children to the portal target as a
    // side-effect and returns []; nothing to insert into `parent`.
    if (!Array.isArray(result) && result) {
      parent.appendChild(result);
      newVNode.ref = result as Element;
    }
    pluginRunner.updated(oldVNode, newVNode);
    return;
  }

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

  if (newVNode.type === 'text' && oldVNode.type === 'text') {
    if (oldVNode.props.value !== newVNode.props.value) {
      (existingElement as Text).data = String(newVNode.props.value);
    }
    newVNode.ref = existingElement as Element | Text;
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
  const oldStyle = oldVNode.props.style;
  const newStyle = newVNode.props.style;

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
      } else if (key === 'style') {
        (el as HTMLElement).style.cssText = '';
      } else if (key === 'dangerouslySetInnerHTML') {
        el.innerHTML = '';
      } else {
        el.removeAttribute(attrKey);
      }
    }
  }

  if (oldStyle && typeof oldStyle === 'object') {
    removeStyleKeys(el as HTMLElement, oldStyle as Record<string, unknown>, typeof newStyle === 'object' && newStyle !== null ? (newStyle as Record<string, unknown>) : undefined);
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
        const styleObj = newVal as Record<string, unknown>;
        for (const styleKey of Object.keys(styleObj)) {
          applyStyleValue(el as HTMLElement, styleKey, styleObj[styleKey]);
        }
      } else if (key === 'dangerouslySetInnerHTML' && typeof newVal === 'object' && newVal !== null) {
        const html = (newVal as { __html: string }).__html;
        if (typeof html === 'string') {
          console.warn('Veliom: dangerouslySetInnerHTML used — ensure content is trusted');
          el.innerHTML = sanitizeHtml(html);
        }
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
    buildKeyMap(newVNode.children || EMPTY_ARR),
  );
  pluginRunner.updated(oldVNode, newVNode);
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
  if (eventContainer !== container) {
    clearDelegation();
  }
  setEventContainer(container);
  container.innerHTML = '';
  pluginRunner.beforeMount(vnode);
  const result = createElement(vnode);
  if (Array.isArray(result)) {
    for (let i = 0; i < result.length; i++) {
      container.appendChild(result[i]);
    }
  } else if (result) {
    container.appendChild(result);
  }
  pluginRunner.mounted(vnode);
}

export function patch(container: Element, oldVNode: VNode, newVNode: VNode): void {
  // Portal patching is handled inside patchVNode (different mount target).
  if (oldVNode.type === PORTAL || newVNode.type === PORTAL) {
    patchVNode(container, oldVNode, newVNode, 0);
    return;
  }
  if (oldVNode.type === EMPTY && newVNode.type === EMPTY) return;
  if (oldVNode.type === EMPTY) {
    appendToParent(container, createElement(newVNode));
    return;
  }
  if (newVNode.type === EMPTY) {
    // removeChildTree handles elements, text, fragments and portals
    // (a portal ref is its target — never remove that from `container`).
    removeChildTree(container, oldVNode);
    return;
  }
  if (
    oldVNode.type === FRAGMENT || newVNode.type === FRAGMENT
  ) {
    const oldChildren = oldVNode.type === FRAGMENT ? (oldVNode.children || []) : [oldVNode];
    const newChildren = newVNode.type === FRAGMENT ? (newVNode.children || []) : [newVNode];
    reconcile(container, oldChildren, newChildren, buildKeyMap(newChildren));
    return;
  }
  patchVNode(container, oldVNode, newVNode, 0);
}
