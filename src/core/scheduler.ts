let pendingCallbacks: Array<() => void> = [];
let rafId: number | null = null;
let flushing = false;

export function scheduleDOMUpdate(fn: () => void): void {
  pendingCallbacks.push(fn);
  if (rafId === null && !flushing) {
    rafId = requestAnimationFrame(() => {
      flushing = true;
      const queue = pendingCallbacks;
      pendingCallbacks = [];
      rafId = null;
      for (let i = 0; i < queue.length; i++) {
        queue[i]();
      }
      flushing = false;
    });
  }
}

export function flushDOMUpdates(): void {
  if (rafId !== null) {
    cancelAnimationFrame(rafId);
    rafId = null;
  }
  flushing = true;
  const queue = pendingCallbacks;
  pendingCallbacks = [];
  for (let i = 0; i < queue.length; i++) {
    queue[i]();
  }
  flushing = false;
}
