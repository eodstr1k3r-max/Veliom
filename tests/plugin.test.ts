import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { usePlugin, getPlugins, removePlugin, clearPlugins, pluginRunner, Plugin } from '../src/core/plugin';
import { h, render, createElement } from '../src/core/renderer';

describe('Plugin System', () => {
  beforeEach(() => {
    clearPlugins();
  });

  it('registers and retrieves plugins', () => {
    const plugin: Plugin = { name: 'test', hooks: {} };
    usePlugin(plugin);
    expect(getPlugins()).toHaveLength(1);
    expect(getPlugins()[0].name).toBe('test');
  });

  it('removes a plugin by name', () => {
    usePlugin({ name: 'a', hooks: {} });
    usePlugin({ name: 'b', hooks: {} });
    removePlugin('a');
    expect(getPlugins()).toHaveLength(1);
    expect(getPlugins()[0].name).toBe('b');
  });

  it('removePlugin is a no-op for non-existent name', () => {
    usePlugin({ name: 'a', hooks: {} });
    removePlugin('nonexistent');
    expect(getPlugins()).toHaveLength(1);
  });

  it('clears all plugins', () => {
    usePlugin({ name: 'a', hooks: {} });
    usePlugin({ name: 'b', hooks: {} });
    clearPlugins();
    expect(getPlugins()).toHaveLength(0);
  });

  it('calls beforeCreate during createElement', () => {
    const fn = vi.fn();
    usePlugin({ name: 'test', hooks: { beforeCreate: fn } });
    const vnode = h('div');
    createElement(vnode);
    expect(fn).toHaveBeenCalledWith(vnode);
  });

  it('calls created after createElement', () => {
    const fn = vi.fn();
    usePlugin({ name: 'test', hooks: { created: fn } });
    const vnode = h('div');
    createElement(vnode);
    expect(fn).toHaveBeenCalledWith(vnode);
  });

  it('calls beforeMount during render', () => {
    const fn = vi.fn();
    usePlugin({ name: 'test', hooks: { beforeMount: fn } });
    const vnode = h('div');
    const el = document.createElement('div');
    render(vnode, el);
    expect(fn).toHaveBeenCalled();
  });

  it('calls mounted after render', () => {
    const fn = vi.fn();
    usePlugin({ name: 'test', hooks: { mounted: fn } });
    const vnode = h('div');
    const el = document.createElement('div');
    render(vnode, el);
    expect(fn).toHaveBeenCalled();
  });

  it('handles plugin hook exceptions without breaking chain', () => {
    const consoleSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    usePlugin({ name: 'throws', hooks: { beforeCreate: () => { throw new Error('fail'); } } });
    const ok = vi.fn();
    usePlugin({ name: 'ok', hooks: { beforeCreate: ok } });
    const vnode = h('div');
    createElement(vnode);
    expect(ok).toHaveBeenCalled();
    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('after removePlugin, hooks no longer fire', () => {
    const fn = vi.fn();
    usePlugin({ name: 'test', hooks: { beforeCreate: fn } });
    removePlugin('test');
    const vnode = h('div');
    createElement(vnode);
    expect(fn).not.toHaveBeenCalled();
  });
});
