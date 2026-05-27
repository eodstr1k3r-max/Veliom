import { VNode } from '../core/renderer';

let componentCount = 0;
let signalCount = 0;

export interface DevToolsState {
  components: Array<{ id: number; name: string; vnode?: VNode }>;
  signals: Array<{ id: number; name: string; value: unknown }>;
}

const state: DevToolsState = { components: [], signals: [] };

export function trackComponent(name: string, vnode?: VNode): number {
  const id = ++componentCount;
  state.components.push({ id, name, vnode });
  return id;
}

export function trackSignal(name: string, value: unknown): number {
  const id = ++signalCount;
  state.signals.push({ id, name, value });
  return id;
}

export function updateSignal(id: number, value: unknown): void {
  for (let i = 0; i < state.signals.length; i++) {
    if (state.signals[i].id === id) {
      state.signals[i].value = value;
      break;
    }
  }
}

function setupGlobalHook(): void {
  if (typeof window !== 'undefined') {
    (window as unknown as Record<string, unknown>)['__VELIOM_DEVTOOLS__'] = {
      getState: () => state,
      reset: () => {
        state.components = [];
        state.signals = [];
        componentCount = 0;
        signalCount = 0;
      },
    };
  }
}

setupGlobalHook();
