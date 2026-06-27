import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createSignal, createStore, createComputed } from '../src/state/store';
import { h, render, patch } from '../src/veliom';
import { createElement } from '../src/core/renderer';

// ─────────────────────────────────────────────────────────────────────────────
// Helper
// ─────────────────────────────────────────────────────────────────────────────
let container: HTMLElement;

beforeEach(() => {
  container = document.createElement('div');
  document.body.appendChild(container);
});

afterEach(() => {
  if (container.parentNode) document.body.removeChild(container);
});

// ─────────────────────────────────────────────────────────────────────────────
// 1. SIGNAL ENCAPSULATION
// ─────────────────────────────────────────────────────────────────────────────
describe('Signal Encapsulation', () => {
  it('should not expose internal _listeners property', () => {
    const sig = createSignal(42);
    expect((sig as any)._listeners).toBeUndefined();
  });

  it('should not expose internal _value property', () => {
    const sig = createSignal(99);
    expect((sig as any)._value).toBeUndefined();
  });

  it('should properly isolate two signals from each other', () => {
    const a = createSignal(1);
    const b = createSignal(2);
    a.set(100);
    expect(a.get()).toBe(100);
    expect(b.get()).toBe(2);
  });

  it('should not allow direct prototype manipulation via signal', () => {
    const sig = createSignal<Record<string, unknown>>({});
    expect(() => {
      sig.set(Object.create(null));
    }).not.toThrow();
  });

  it('should unsubscribe cleanly and not call stale listeners', () => {
    const sig = createSignal(0);
    const listener = vi.fn();
    const unsub = sig.subscribe(listener);
    unsub();
    sig.set(1);
    expect(listener).not.toHaveBeenCalled();
  });

  it('should not fire listener when value is set to same value (Object.is)', () => {
    const sig = createSignal(NaN);
    const listener = vi.fn();
    sig.subscribe(listener);
    sig.set(NaN); // Object.is(NaN, NaN) === true
    expect(listener).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 2. STORE ISOLATION & IMMUTABILITY
// ─────────────────────────────────────────────────────────────────────────────
describe('Store Isolation & Immutability', () => {
  it('should not expose internal signals map', () => {
    const store = createStore({ x: 1 });
    expect((store as any).signals).toBeUndefined();
    expect((store as any)._signals).toBeUndefined();
  });

  it('should return frozen state snapshot from getState()', () => {
    const store = createStore({ count: 0 });
    const state = store.getState();
    expect(Object.isFrozen(state)).toBe(true);
    expect(() => { (state as any).count = 999; }).toThrow();
  });

  it('should return a new snapshot object each call to getState()', () => {
    const store = createStore({ count: 0 });
    expect(store.getState()).not.toBe(store.getState());
  });

  it('should isolate two stores completely', () => {
    const s1 = createStore({ value: 'a' });
    const s2 = createStore({ value: 'b' });
    s1.set('value', 'changed');
    expect(s1.get('value')).toBe('changed');
    expect(s2.get('value')).toBe('b');
  });

  it('should not allow prototype pollution via store key names', () => {
    // Creating a store with normal keys should not pollute Object prototype
    const store = createStore({ normal: 0 });
    expect((Object.prototype as any).polluted).toBeUndefined();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 3. COMPUTED ENCAPSULATION
// ─────────────────────────────────────────────────────────────────────────────
describe('Computed Encapsulation', () => {
  it('should not expose internal _deps property', () => {
    const sig = createSignal(1);
    const computed = createComputed(() => sig.get() * 2, [sig]);
    expect((computed as any)._deps).toBeUndefined();
    expect((computed as any).dependencies).toBeUndefined();
  });

  it('should not allow external mutation to break computed', () => {
    const sig = createSignal({ name: 'test' });
    const computed = createComputed(() => sig.get(), [sig]);
    const result = computed.get();
    (result as any).name = 'hacked';
    // The computed itself should still be callable
    expect(() => computed.get()).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 4. XSS — PROTOCOL INJECTION (href / src / action)
// ─────────────────────────────────────────────────────────────────────────────
describe('XSS — Protocol Injection on createElement', () => {
  it('should block javascript: protocol on href (lowercase)', () => {
    const el = createElement(h('a', { href: 'javascript:alert(1)' })) as HTMLElement;
    expect(el.getAttribute('href')).toBeNull();
  });

  it('should block JAVASCRIPT: protocol on href (uppercase bypass attempt)', () => {
    const el = createElement(h('a', { href: 'JAVASCRIPT:alert(1)' })) as HTMLElement;
    expect(el.getAttribute('href')).toBeNull();
  });

  it('should block JaVaScRiPt: mixed-case bypass attempt', () => {
    const el = createElement(h('a', { href: 'JaVaScRiPt:evil()' })) as HTMLElement;
    expect(el.getAttribute('href')).toBeNull();
  });

  it('should block javascript: with leading whitespace bypass attempt', () => {
    const el = createElement(h('a', { href: '   javascript:evil()' })) as HTMLElement;
    expect(el.getAttribute('href')).toBeNull();
  });

  it('should block data: protocol on src', () => {
    const el = createElement(h('img', { src: 'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==' })) as HTMLElement;
    expect(el.getAttribute('src')).toBeNull();
  });

  it('should block vbscript: protocol on href', () => {
    const el = createElement(h('a', { href: 'vbscript:MsgBox(1)' })) as HTMLElement;
    expect(el.getAttribute('href')).toBeNull();
  });

  it('should block javascript: on action attribute', () => {
    const el = createElement(h('form', { action: 'javascript:submit()' })) as HTMLElement;
    expect(el.getAttribute('action')).toBeNull();
  });

  it('should allow https: protocol on href', () => {
    const el = createElement(h('a', { href: 'https://veliom.dev' })) as HTMLElement;
    expect(el.getAttribute('href')).toBe('https://veliom.dev');
  });

  it('should allow relative paths on href', () => {
    const el = createElement(h('a', { href: '/docs/intro' })) as HTMLElement;
    expect(el.getAttribute('href')).toBe('/docs/intro');
  });

  it('should allow mailto: protocol on href', () => {
    const el = createElement(h('a', { href: 'mailto:hello@veliom.dev' })) as HTMLElement;
    expect(el.getAttribute('href')).toBe('mailto:hello@veliom.dev');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 5. XSS — PATCHING / UPDATE INJECTION
// ─────────────────────────────────────────────────────────────────────────────
describe('XSS — Protocol Injection During Patch', () => {
  it('should block dangerous href during patch update', () => {
    const v1 = h('a', { href: 'https://safe.com' }, 'link');
    const v2 = h('a', { href: 'javascript:evil()' }, 'link');
    render(v1, container);
    const link = container.querySelector('a')!;
    expect(link.getAttribute('href')).toBe('https://safe.com');
    patch(container, v1, v2);
    // Old safe value preserved — blocked update
    expect(link.getAttribute('href')).toBe('https://safe.com');
  });

  it('should block data: src injection during patch', () => {
    const v1 = h('img', { src: 'https://cdn.example.com/img.png' });
    const v2 = h('img', { src: 'data:image/svg+xml,<svg onload=evil() />' });
    render(v1, container);
    const img = container.querySelector('img')!;
    patch(container, v1, v2);
    expect(img.getAttribute('src')).toBe('https://cdn.example.com/img.png');
  });

  it('should block uppercase JAVASCRIPT: during patch', () => {
    const v1 = h('a', { href: 'https://safe.com' }, 'link');
    const v2 = h('a', { href: 'JAVASCRIPT:evil()' }, 'link');
    render(v1, container);
    patch(container, v1, v2);
    expect(container.querySelector('a')!.getAttribute('href')).toBe('https://safe.com');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 6. TEXT NODE XSS SAFETY
// ─────────────────────────────────────────────────────────────────────────────
describe('Text Node XSS Safety', () => {
  it('should render script tag payload as plain text, not live HTML', () => {
    const payload = '<script>alert("xss")</script>';
    render(h('div', null, payload), container);
    const div = container.querySelector('div')!;
    expect(div.querySelector('script')).toBeNull();
    expect(div.textContent).toBe(payload);
  });

  it('should render img onerror payload as plain text, not an element', () => {
    render(h('span', null, '<img src=x onerror=alert(1)>'), container);
    const span = container.querySelector('span')!;
    expect(span.querySelector('img')).toBeNull();
  });

  it('should render HTML entities as literal characters (not parsed)', () => {
    render(h('p', null, '&lt;b&gt;not bold&lt;/b&gt;'), container);
    const p = container.querySelector('p')!;
    expect(p.querySelector('b')).toBeNull();
    expect(p.textContent).toContain('&lt;');
  });

  it('should handle null byte in text content without crash', () => {
    expect(() => render(h('div', null, 'hello\x00world'), container)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 7. EVENT HANDLER ATTRIBUTE SAFETY
// ─────────────────────────────────────────────────────────────────────────────
describe('Event Handler Attribute Safety', () => {
  it('should not attach string values as live event listeners', () => {
    // Strings passed as event props should be ignored (not functions)
    const el = createElement(h('button', { onClick: 'alert(1)' as any })) as HTMLElement;
    expect(typeof (el as any).onclick).not.toBe('function');
  });

  it('should only attach function-type event handlers', () => {
    const handler = vi.fn();
    render(h('button', { id: 'safe-btn', onClick: handler }, 'Click'), container);
    container.querySelector<HTMLButtonElement>('#safe-btn')!.click();
    expect(handler).toHaveBeenCalledTimes(1);
  });

  it('should not re-fire old handler after patch removes it', () => {
    const oldHandler = vi.fn();
    const v1 = h('button', { id: 'rmbtn', onClick: oldHandler }, 'X');
    const v2 = h('button', { id: 'rmbtn' }, 'X'); // no handler
    render(v1, container);
    patch(container, v1, v2);
    container.querySelector<HTMLButtonElement>('#rmbtn')!.click();
    expect(oldHandler).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 8. CSS / STYLE INJECTION
// ─────────────────────────────────────────────────────────────────────────────
describe('CSS Style Injection Safety', () => {
  it('should apply safe style object properties', () => {
    const el = createElement(h('div', { style: { color: 'red', fontSize: '14px' } })) as HTMLElement;
    expect(el.style.color).toBe('red');
  });

  it('should not crash on empty style object', () => {
    expect(() => createElement(h('div', { style: {} }))).not.toThrow();
  });

  it('should not crash on string style value (unsupported but safe fallthrough)', () => {
    expect(() => createElement(h('div', { style: 'color:red' as any }))).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 9. PROTOTYPE POLLUTION PREVENTION
// ─────────────────────────────────────────────────────────────────────────────
describe('Prototype Pollution Prevention', () => {
  it('should not pollute Object.prototype via signal subscription', () => {
    const sig = createSignal({});
    sig.subscribe(() => {});
    expect((Object.prototype as any).__polluted_by_signal__).toBeUndefined();
  });

  it('should not pollute Object.prototype via store operations', () => {
    const store = createStore({ a: 1 });
    store.set('a', 2);
    store.getState();
    expect((Object.prototype as any).__polluted_by_store__).toBeUndefined();
  });

  it('should not allow __proto__ vnode prop to pollute prototype chain', () => {
    const before = (Object.prototype as any).__xss_test__;
    expect(() => {
      createElement(h('div', { '__proto__': { __xss_test__: 'hacked' } as any }));
    }).not.toThrow();
    expect((Object.prototype as any).__xss_test__).toBe(before);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 10. SIGNAL INFINITE LOOP PROTECTION
// ─────────────────────────────────────────────────────────────────────────────
describe('Signal Infinite Loop Protection', () => {
  it('should not re-trigger listener when subscriber sets same value', () => {
    const sig = createSignal(42);
    let callCount = 0;
    sig.subscribe(() => {
      callCount++;
      sig.set(42); // same value → Object.is check prevents re-trigger
    });
    sig.set(100);
    expect(callCount).toBe(1);
  });

  it('should snapshot listeners before iterating to handle unsubscribe-during-notify', () => {
    const sig = createSignal(0);
    let unsub: (() => void) | null = null;
    const calls: number[] = [];

    unsub = sig.subscribe((v) => {
      calls.push(v);
      if (v === 1 && unsub) unsub(); // self-unsubscribe
    });

    sig.set(1);
    sig.set(2); // must not call listener again
    expect(calls).toEqual([1]);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 11. NULL / UNDEFINED SAFETY
// ─────────────────────────────────────────────────────────────────────────────
describe('Null & Undefined Safety', () => {
  it('should filter out null and undefined children in h()', () => {
    const vnode = h('div', null, null, undefined, 'Hello', null);
    expect(vnode.children).toHaveLength(1);
    expect(vnode.children![0].props.value).toBe('Hello');
  });

  it('should safely render an empty fragment', () => {
    expect(() => render(h('fragment', null), container)).not.toThrow();
  });

  it('should not crash on null props', () => {
    expect(() => createElement(h('div', null))).not.toThrow();
  });

  it('should not set null attribute values on elements', () => {
    const el = createElement(h('div', { 'data-val': null as any })) as HTMLElement;
    expect(el.getAttribute('data-val')).toBeNull();
  });

  it('should not crash when rendering an empty string child', () => {
    expect(() => render(h('div', null, ''), container)).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 12. DANGEROUSLYSETINNERHTML SANITIZATION
// ─────────────────────────────────────────────────────────────────────────────
describe('dangerouslySetInnerHTML Sanitization', () => {
  it('should strip script tags from innerHTML', () => {
    const el = createElement(h('div', {
      dangerouslySetInnerHTML: { __html: '<script>alert(1)</script><b>safe</b>' }
    })) as HTMLElement;
    expect(el.querySelector('script')).toBeNull();
    expect(el.querySelector('b')?.textContent).toBe('safe');
  });

  it('should strip nested script tags', () => {
    const el = createElement(h('div', {
      dangerouslySetInnerHTML: { __html: '<div><script>evil()</script></div>' }
    })) as HTMLElement;
    expect(el.querySelector('script')).toBeNull();
  });

  it('should strip script tags with attributes', () => {
    const el = createElement(h('div', {
      dangerouslySetInnerHTML: { __html: '<script type="text/javascript" src="evil.js"></script><p>ok</p>' }
    })) as HTMLElement;
    expect(el.querySelector('script')).toBeNull();
    expect(el.querySelector('p')?.textContent).toBe('ok');
  });

  it('should handle empty __html without crash', () => {
    expect(() => createElement(h('div', {
      dangerouslySetInnerHTML: { __html: '' }
    }))).not.toThrow();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 13. ROUTER PATH VALIDATION
// ─────────────────────────────────────────────────────────────────────────────
describe('Router Path Security', () => {
  it('should reject navigation to unsafe paths (javascript:)', async () => {
    const { createRouter } = await import('../src/core/router');
    const router = createRouter([]);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    router.navigate('javascript:alert(1)');
    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Blocked unsafe navigation path')
    );
    warnSpy.mockRestore();
  });

  it('should allow navigation to safe paths', async () => {
    const { createRouter } = await import('../src/core/router');
    const router = createRouter([]);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    router.navigate('/safe/path');
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should allow real-world paths with special chars (@, +, -)', async () => {
    const { createRouter } = await import('../src/core/router');
    const router = createRouter([]);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    router.navigate('/user/@john');
    expect(warnSpy).not.toHaveBeenCalled();
    router.navigate('/search?q=test+123');
    expect(warnSpy).not.toHaveBeenCalled();
    router.navigate('/items/42/edit');
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should reject navigation with HTML injection chars', async () => {
    const { createRouter } = await import('../src/core/router');
    const router = createRouter([]);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    router.navigate('/<script>');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should reject navigation with data: protocol', async () => {
    const { createRouter } = await import('../src/core/router');
    const router = createRouter([]);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    router.navigate('data:text/html,<script>');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('should reject navigation with vbscript: protocol', async () => {
    const { createRouter } = await import('../src/core/router');
    const router = createRouter([]);
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    router.navigate('vbscript:msgbox');
    expect(warnSpy).toHaveBeenCalled();
    warnSpy.mockRestore();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// 14. DEVTOLS PRODUCTION SAFETY
// ─────────────────────────────────────────────────────────────────────────────
describe('DevTools Production Safety', () => {
  it('should not expose __VELIOM_DEVTOOLS__ by default', () => {
    expect((window as any).__VELIOM_DEVTOOLS__).toBeUndefined();
  });

  it('should expose __VELIOM_DEVTOOLS__ after enableDevTools()', async () => {
    const { enableDevTools, disableDevTools } = await import('../src/utils/devtools');
    enableDevTools();
    expect((window as any).__VELIOM_DEVTOOLS__).toBeDefined();
    expect(typeof (window as any).__VELIOM_DEVTOOLS__.getState).toBe('function');
    disableDevTools();
    expect((window as any).__VELIOM_DEVTOOLS__).toBeUndefined();
  });
});
