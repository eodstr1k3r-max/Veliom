import { VNode } from './renderer.js';
import { sanitizeHtml } from '../utils/sanitize.js';

const VOID_ELEMENTS = new Set([
  'area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input',
  'link', 'meta', 'param', 'source', 'track', 'wbr',
]);

const ATTR_SSR: Record<string, string> = {
  className: 'class',
  classList: 'class',
  htmlFor: 'for',
  readOnly: 'readonly',
};

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function serializeValue(key: string, val: unknown): string {
  if (key === 'style' && val && typeof val === 'object') {
    const styleObj = val as Record<string, unknown>;
    let out = '';
    for (const styleKey of Object.keys(styleObj)) {
      const styleValue = styleObj[styleKey];
      if (styleValue === null || styleValue === undefined || styleValue === false) continue;
      const cssKey = styleKey.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      out += `${cssKey}:${String(styleValue)};`;
    }
    return out;
  }
  if ((key === 'className' || key === 'class' || key === 'classList') && Array.isArray(val)) {
    return val.filter(Boolean).join(' ');
  }
  if ((key === 'className' || key === 'class' || key === 'classList') && val && typeof val === 'object') {
    return Object.entries(val as Record<string, unknown>)
      .filter(([, v]) => v)
      .map(([k]) => k)
      .join(' ');
  }
  return String(val);
}

function attrsToString(props: Record<string, unknown>): string {
  let out = '';
  const keys = Object.keys(props);
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    if (key === 'children' || key === 'key' || key === 'ref' || key === 'dangerouslySetInnerHTML') continue;
    if (key.startsWith('on')) continue;
    const val = props[key];
    if (val === false || val === null || val === undefined) continue;
    const attrName = ATTR_SSR[key] ?? key;
    if (val === true) {
      out += ` ${attrName}`;
    } else {
      out += ` ${attrName}="${escapeHtml(serializeValue(key, val))}"`;
    }
  }
  return out;
}

export function renderToString(vnode: VNode): string {
  const type = vnode.type;

  if (type === 'text') {
    return escapeHtml(String(vnode.props.value ?? ''));
  }

  if (type === 'fragment') {
    let out = '';
    if (vnode.children) {
      for (let i = 0; i < vnode.children.length; i++) {
        out += renderToString(vnode.children[i]);
      }
    }
    return out;
  }

  if (type === 'empty') return '';

  if (type === 'portal') {
    let out = '';
    if (vnode.children) {
      for (let i = 0; i < vnode.children.length; i++) {
        out += renderToString(vnode.children[i]);
      }
    }
    return out;
  }

  const tag = type;
  const propsStr = attrsToString(vnode.props);

  if (VOID_ELEMENTS.has(tag)) {
    return `<${tag}${propsStr}>`;
  }

  let inner = '';
  const innerHtml = vnode.props.dangerouslySetInnerHTML as { __html: string } | undefined;
  if (innerHtml?.__html) {
    console.warn('Veliom: dangerouslySetInnerHTML used in SSR — ensure content is trusted');
    inner = sanitizeHtml(innerHtml.__html);
  } else if (vnode.children) {
    for (let i = 0; i < vnode.children.length; i++) {
      inner += renderToString(vnode.children[i]);
    }
  }

  return `<${tag}${propsStr}>${inner}</${tag}>`;
}

export function renderToStringWithData(
  vnode: VNode,
  data: Record<string, unknown>
): string {
  const html = renderToString(vnode);
  const serialized = JSON.stringify(data)
    .replace(/<\/script>/gi, '<\\/script>')
    .replace(/<!--/g, '<\\!--');
  return `${html}<script>window.__INITIAL_DATA__=${serialized};</script>`;
}
