import { VNode } from '../core/renderer';

let componentCount = 0;
let signalCount = 0;

export interface DevToolsState {
  components: Array<{ id: number; name: string; vnode?: VNode }>;
  signals: Array<{ id: number; name: string; value: unknown }>;
}

const MAX_ENTRIES = 1000;
const state: DevToolsState = { components: [], signals: [] };
let enabled = false;

export function trackComponent(name: string, vnode?: VNode): number {
  if (!enabled) return 0;
  const id = ++componentCount;
  state.components.push({ id, name, vnode });
  if (state.components.length > MAX_ENTRIES) state.components.shift();
  return id;
}

export function trackSignal(name: string, value: unknown): number {
  if (!enabled) return 0;
  const id = ++signalCount;
  state.signals.push({ id, name, value });
  if (state.signals.length > MAX_ENTRIES) state.signals.shift();
  return id;
}

export function updateSignal(id: number, value: unknown): void {
  if (!enabled) return;
  for (let i = 0; i < state.signals.length; i++) {
    if (state.signals[i].id === id) {
      state.signals[i].value = value;
      break;
    }
  }
}

export function enableDevTools(): void {
  enabled = true;
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>)['__VELIOM_DEVTOOLS__'] = {
      getState: () => ({ components: [...state.components], signals: [...state.signals] }),
      reset: () => {
        state.components = [];
        state.signals = [];
        componentCount = 0;
        signalCount = 0;
      },
    };
  }
}

export function disableDevTools(): void {
  enabled = false;
  if (typeof window !== 'undefined') {
    delete (window as unknown as Record<string, unknown>)['__VELIOM_DEVTOOLS__'];
  }
}

export function isDevToolsEnabled(): boolean {
  return enabled;
}
