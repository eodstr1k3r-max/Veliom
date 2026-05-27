let pendingCallbacks: Array<() => void> = [];
let rafId: number | null = null;

export function scheduleDOMUpdate(fn: () => void): void {
  pendingCallbacks.push(fn);
  if (rafId === null) {
    rafId = requestAnimationFrame(() => {
      const queue = pendingCallbacks;
      pendingCallbacks = [];
      rafId = null;
      for (let i = 0; i < queue.length; i++) {
        queue[i]();
      }
    });
  }
}

export function flushDOMUpdates(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  const queue = pendingCallbacks;
  pendingCallbacks = [];
  for (let i = 0; i < queue.length; i++) {
    queue[i]();
  }
}
