let pendingCallbacks: Array<() => void> = [];
let rafId: number | null = null;
let flushing = false;

function scheduleFrame(): void {
  if (typeof requestAnimationFrame === 'undefined') {
    flushing = true;
    const queue = pendingCallbacks;
    pendingCallbacks = [];
    rafId = null;
    for (let i = 0; i < queue.length; i++) {
      queue[i]();
    }
    flushing = false;
    if (pendingCallbacks.length > 0) {
      scheduleFrame();
    }
    return;
  }
  rafId = requestAnimationFrame(flushQueue);
}

function flushQueue(): void {
  flushing = true;
  const queue = pendingCallbacks;
  pendingCallbacks = [];
  rafId = null;
  for (let i = 0; i < queue.length; i++) {
    queue[i]();
  }
  flushing = false;
  // Callbacks may schedule follow-ups while flushing (no new frame is
  // requested in that case) — drain them instead of stranding them.
  if (pendingCallbacks.length > 0) {
    scheduleFrame();
  }
}

export function scheduleDOMUpdate(fn: () => void): void {
  pendingCallbacks.push(fn);
  if (rafId === null && !flushing) {
    scheduleFrame();
  }
}

export function flushDOMUpdates(): void {
  if (rafId !== null) {
    if (typeof cancelAnimationFrame !== 'undefined') {
      cancelAnimationFrame(rafId);
    }
    rafId = null;
  }
  flushing = true;
  const queue = pendingCallbacks;
  pendingCallbacks = [];
  for (let i = 0; i < queue.length; i++) {
    queue[i]();
  }
  flushing = false;
  if (pendingCallbacks.length > 0 && rafId === null) {
    scheduleFrame();
  }
}
