import { describe, it, expect, vi } from 'vitest';
import {
  createErrorBoundary,
  ErrorBoundary,
  setGlobalErrorHandler,
  getGlobalErrorHandler,
  reportError,
  handleComponentError,
} from '../src/core/error';
import { h, render } from '../src/core/renderer';

describe('createErrorBoundary', () => {
  it('creates an error boundary with VNode fallback', () => {
    const boundary = createErrorBoundary(h('div', null, 'error'));
    const vnode = boundary.render({ hasError: true, error: new Error('test') });
    expect(vnode.type).toBe('div');
    expect(vnode.children![0].props.value).toBe('error');
  });

  it('returns empty VNode when no error', () => {
    const boundary = createErrorBoundary(h('div', null, 'error'));
    const vnode = boundary.render({ hasError: false, error: null });
    expect(vnode.type).toBe('empty');
  });

  it('creates an error boundary with function fallback', () => {
    const fallbackFn = (err: Error) => h('p', null, err.message);
    const boundary = createErrorBoundary(fallbackFn);
    const vnode = boundary.render({ hasError: true, error: new Error('oops') });
    expect(vnode.type).toBe('p');
    expect(vnode.children![0].props.value).toBe('oops');
  });

  it('calls onError when componentDidCatch is invoked', () => {
    const onError = vi.fn();
    const boundary = createErrorBoundary(h('div'), onError);
    boundary.componentDidCatch!(new Error('fail'), { componentStack: '...' });
    expect(onError).toHaveBeenCalledWith(new Error('fail'), { componentStack: '...' });
  });

  it('getDerivedStateFromError returns correct state', () => {
    const boundary = createErrorBoundary(h('div'));
    const state = boundary.getDerivedStateFromError!(new Error('err'));
    expect(state).toEqual({ hasError: true, error: new Error('err') });
  });
});

describe('Global error handler', () => {
  it('sets and gets global error handler', () => {
    const handler = vi.fn();
    setGlobalErrorHandler(handler);
    expect(getGlobalErrorHandler()).toBe(handler);
    setGlobalErrorHandler(undefined);
    expect(getGlobalErrorHandler()).toBeUndefined();
  });

  it('reportError calls global handler', () => {
    const handler = vi.fn();
    setGlobalErrorHandler(handler);
    reportError(new Error('test'));
    expect(handler).toHaveBeenCalledWith(new Error('test'), {});
    setGlobalErrorHandler(undefined);
  });

  it('reportError falls back to console.error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    reportError(new Error('fallback'));
    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});

describe('ErrorBoundary component', () => {
  it('renders children when no error', () => {
    const vnode = ErrorBoundary({
      fallback: h('div', null, 'error'),
      children: h('p', null, 'ok'),
    });
    expect(vnode.type).toBe('p');
    expect(vnode.children![0].props.value).toBe('ok');
  });

  it('renders fallback on error with lazy children', () => {
    const result = ErrorBoundary({
      fallback: (err: Error) => h('p', null, err.message),
      children: () => { throw new Error('crash'); },
    });
    expect(result.type).toBe('p');
    expect(result.children![0].props.value).toBe('crash');
  });

  it('calls onError when error occurs in lazy children', () => {
    const onError = vi.fn();
    const result = ErrorBoundary({
      fallback: h('span', null, 'error'),
      children: () => { throw new Error('oops'); },
      onError,
    });
    expect(onError).toHaveBeenCalledWith(new Error('oops'), {});
    expect(result.type).toBe('span');
  });

  it('passes VNode children through directly', () => {
    const vnode = ErrorBoundary({
      fallback: h('div'),
      children: h('span', { id: 'direct' }),
    });
    expect(vnode.type).toBe('span');
    expect(vnode.props.id).toBe('direct');
  });

  it('renders fallback with VNode fallback on error', () => {
    const result = ErrorBoundary({
      fallback: h('div', null, 'error'),
      children: () => { throw new Error('fail'); },
    });
    expect(result.type).toBe('div');
    expect(result.children![0].props.value).toBe('error');
  });

  it('does not throw when onError itself throws', () => {
    const throwingOnError = vi.fn(() => { throw new Error('onError crash'); });
    const result = ErrorBoundary({
      fallback: h('span', null, 'safe'),
      children: () => { throw new Error('original'); },
      onError: throwingOnError,
    });
    expect(throwingOnError).toHaveBeenCalled();
    expect(result.type).toBe('span');
    expect(result.children![0].props.value).toBe('safe');
  });
});

describe('handleComponentError', () => {
  it('returns null when no handler', () => {
    const result = handleComponentError(new Error('x'));
    expect(result).toBeNull();
  });

  it('returns VNode from handler', () => {
    const handler = vi.fn(() => h('div', null, 'handled'));
    const result = handleComponentError(new Error('x'), handler);
    expect(result!.type).toBe('div');
  });

  it('converts non-Error to Error', () => {
    const handler = vi.fn(() => h('span'));
    handleComponentError('string error', handler);
    expect(handler).toHaveBeenCalledWith(new Error('string error'), {});
  });
});
