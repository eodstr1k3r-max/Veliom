import { createSignal, Signal, pushTrackingEffect, popTrackingEffect } from './store';

export type CleanupFn = () => void;
export type EffectFn = () => CleanupFn | void;

interface Effect {
  fn: EffectFn;
  deps: unknown[];
  cleanup?: CleanupFn;
}

export interface Context {
  effects: Effect[];
  memoCache: Map<string, { deps: unknown[]; value: unknown }>;
  stateCache?: Signal<unknown>[];
  refCache?: { current: unknown }[];
  contextCache?: Map<symbol, unknown>;
  effectIndex: number;
}

const contextStack: Context[] = [];

export function pushComponentContext(ctx: Context = { effects: [], memoCache: new Map(), effectIndex: 0 }): Context {
  contextStack.push(ctx);
  return ctx;
}

export function popComponentContext(): void {
  contextStack.pop();
}

export function getCurrentContext(): Context | undefined {
  return contextStack[contextStack.length - 1];
}

function scheduleMicrotask(fn: () => void): void {
  queueMicrotask(fn);
}

export function useEffect(fn: EffectFn, deps?: unknown[]): void {
  const ctx = getCurrentContext();
  if (!ctx) throw new Error('useEffect must be called inside a component');

  const idx = ctx.effectIndex++;
  const existingEffect = ctx.effects[idx];

  if (deps && existingEffect && depsEqual(existingEffect.deps, deps)) {
    return;
  }

  if (existingEffect?.cleanup) {
    existingEffect.cleanup();
  }

  const effect: Effect = { fn, deps: deps || [], cleanup: undefined };
  ctx.effects[idx] = effect;

  const run = () => {
    if (effect.cleanup) {
      effect.cleanup();
      effect.cleanup = undefined;
    }
    const cleanup = effect.fn();
    if (typeof cleanup === 'function') {
      effect.cleanup = cleanup;
    }
  };

  scheduleMicrotask(run);
}

export function runEffects(ctx: Context): void {
  for (let i = 0; i < ctx.effects.length; i++) {
    const effect = ctx.effects[i];
    if (!effect) continue;

    if (effect.cleanup) {
      effect.cleanup();
      effect.cleanup = undefined;
    }

    const cleanup = effect.fn();
    if (typeof cleanup === 'function') {
      effect.cleanup = cleanup;
    }
  }
}

export function cleanupEffects(ctx: Context): void {
  for (let i = 0; i < ctx.effects.length; i++) {
    const effect = ctx.effects[i];
    if (effect?.cleanup) {
      effect.cleanup();
      effect.cleanup = undefined;
    }
  }
}

export function useMemo<T>(fn: () => T, deps: unknown[]): T {
  const ctx = getCurrentContext();
  if (!ctx) throw new Error('useMemo must be called inside a component');

  const memoIndex = ctx.effectIndex++;
  const cache = ctx.memoCache;
  const cacheKey = `memo_${memoIndex}`;
  const cached = cache.get(cacheKey);

  if (cached && depsEqual(cached.deps, deps)) {
    return cached.value as T;
  }

  const value = fn();
  cache.set(cacheKey, { deps: [...deps], value });
  return value;
}

export function useCallback<T extends (...args: unknown[]) => unknown>(
  fn: T,
  deps: unknown[]
): T {
  return useMemo(() => fn, deps);
}

export function useState<T>(
  initialValue: T
): [() => T, (value: T | ((prev: T) => T)) => void] {
  const ctx = getCurrentContext();
  if (!ctx) throw new Error('useState must be called inside a component');

  const stateIndex = ctx.effectIndex++;
  if (!ctx.stateCache) {
    ctx.stateCache = [];
  }

  let signal = ctx.stateCache[stateIndex] as Signal<T> | undefined;
  if (!signal) {
    signal = createSignal(initialValue);
    ctx.stateCache[stateIndex] = signal;
  }

  const get = () => signal!.get() as T;
  const set = (newValue: T | ((prev: T) => T)) => {
    const prev = signal!.get();
    const v = typeof newValue === 'function' ? (newValue as (prev: T) => T)(prev) : newValue;
    signal!.set(v);
  };

  return [get, set];
}

export function useReducer<T, A>(
  reducer: (state: T, action: A) => T,
  initialValue: T
): [() => T, (action: A) => void] {
  const ctx = getCurrentContext();
  if (!ctx) throw new Error('useReducer must be called inside a component');

  const stateIndex = ctx.effectIndex++;
  if (!ctx.stateCache) {
    ctx.stateCache = [];
  }

  let signal = ctx.stateCache[stateIndex] as Signal<T> | undefined;
  if (!signal) {
    signal = createSignal(initialValue);
    ctx.stateCache[stateIndex] = signal;
  }

  const dispatch = (action: A) => {
    const prev = signal!.get();
    const next = reducer(prev, action);
    signal!.set(next);
  };

  return [() => signal!.get() as T, dispatch];
}

export function usePrevious<T>(value: T): () => T | undefined {
  const ref = useRef<{ val: T | undefined }>({ val: undefined });
  const prev = ref.current!.val;
  ref.current!.val = value;
  return () => prev;
}

export function useDebouncedValue<T>(value: () => T, delay: number = 300): () => T {
  const [get, set] = useState(value());
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const tracker = () => {
    const v = value();
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => set(v), delay);
  };

  const runner = () => {
    pushTrackingEffect(runner);
    try {
      tracker();
    } finally {
      popTrackingEffect();
    }
  };
  runner();

  return get;
}

export function useTransition(): [() => boolean, (fn: () => void) => void] {
  const [isPending, setPending] = useState(false);
  const startTransition = (fn: () => void) => {
    setPending(true);
    queueMicrotask(() => {
      try {
        fn();
      } finally {
        setPending(false);
      }
    });
  };
  return [isPending, startTransition];
}

export function useEventListener<K extends keyof HTMLElementEventMap>(
  target: Element | Window | Document | null,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void {
  useEffect(() => {
    if (!target) return;
    target.addEventListener(event as string, handler as EventListener, options);
    return () => target.removeEventListener(event as string, handler as EventListener, options);
  }, [target, event]);
}

export function useInterval(fn: () => void, delay: number | null): void {
  useEffect(() => {
    if (delay === null) return;
    const id = setInterval(fn, delay);
    return () => clearInterval(id);
  }, [delay]);
}

export function useTimeout(fn: () => void, delay: number | null): void {
  useEffect(() => {
    if (delay === null) return;
    const id = setTimeout(fn, delay);
    return () => clearTimeout(id);
  }, [delay]);
}

export function useMediaQuery(query: string): () => boolean {
  const initial = typeof window !== 'undefined' && typeof window.matchMedia === 'function'
    ? window.matchMedia(query).matches : false;
  const [get, set] = useState(initial);
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mql = window.matchMedia(query);
    const handler = (e: MediaQueryListEvent) => set(e.matches);
    mql.addEventListener('change', handler);
    set(mql.matches);
    return () => mql.removeEventListener('change', handler);
  }, [query]);
  return get;
}

export function useLocalStorage<T>(key: string, defaultValue: T): [() => T, (value: T) => void] {
  let initial = defaultValue;
  try {
    const stored = localStorage.getItem(key);
    if (stored !== null) initial = JSON.parse(stored);
  } catch {}
  const [get, set] = useState<T>(initial);

  const setWithStorage = (value: T) => {
    set(value);
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  };

  return [get, setWithStorage];
}

export function useIntersectionObserver(
  target: Element | null | undefined,
  options?: IntersectionObserverInit
): () => IntersectionObserverEntry | null {
  const [get, set] = useState<IntersectionObserverEntry | null>(null);
  useEffect(() => {
    if (!target) return;
    const observer = new IntersectionObserver(([entry]) => set(entry), options);
    observer.observe(target);
    return () => observer.disconnect();
  }, [target]);
  return get;
}

export function useResizeObserver(
  target: Element | null | undefined
): () => DOMRectReadOnly | null {
  const [get, set] = useState<DOMRectReadOnly | null>(null);
  useEffect(() => {
    if (!target) return;
    const observer = new ResizeObserver(([entry]) => {
      if (entry.contentRect) set(entry.contentRect);
    });
    observer.observe(target);
    return () => observer.disconnect();
  }, [target]);
  return get;
}

export function useClipboard(): {
  copy: (text: string) => Promise<boolean>;
  copied: () => boolean;
} {
  const [copied, setCopied] = useState(false);
  const copy = async (text: string): Promise<boolean> => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      return true;
    } catch {
      return false;
    }
  };
  return { copy, copied };
}

export function useDocumentTitle(title: string): void {
  useEffect(() => {
    const prev = document.title;
    document.title = title;
    return () => { document.title = prev; };
  }, [title]);
}

export function useOnlineStatus(): () => boolean {
  const [get, set] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  useEffect(() => {
    const on = () => set(true);
    const off = () => set(false);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);
  return get;
}

export function usePreferredColorScheme(): () => 'light' | 'dark' {
  const isDark = useMediaQuery('(prefers-color-scheme: dark)');
  return () => isDark() ? 'dark' : 'light';
}

export function useGeolocation(options?: PositionOptions): {
  coords: () => GeolocationCoordinates | null;
  error: () => string | null;
  loading: () => boolean;
} {
  const [coords, setCoords] = useState<GeolocationCoordinates | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Geolocation not supported');
      setLoading(false);
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords(pos.coords); setLoading(false); },
      (err) => { setError(err.message); setLoading(false); },
      options
    );
  }, []);
  return { coords, error, loading };
}

export function useWindowSize(): () => { width: number; height: number } {
  const [get, set] = useState({ width: window.innerWidth, height: window.innerHeight });
  useEffect(() => {
    const onResize = () => set({ width: window.innerWidth, height: window.innerHeight });
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);
  return get;
}

export function useKeyPress(targetKey: string): () => boolean {
  const [get, set] = useState(false);
  useEffect(() => {
    const down = (e: KeyboardEvent) => { if (e.key === targetKey) set(true); };
    const up = (e: KeyboardEvent) => { if (e.key === targetKey) set(false); };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, [targetKey]);
  return get;
}

export function useHover(
  element: HTMLElement | null | undefined
): () => boolean {
  const [get, set] = useState(false);
  useEffect(() => {
    if (!element) return;
    const enter = () => set(true);
    const leave = () => set(false);
    element.addEventListener('mouseenter', enter);
    element.addEventListener('mouseleave', leave);
    return () => {
      element.removeEventListener('mouseenter', enter);
      element.removeEventListener('mouseleave', leave);
    };
  }, [element]);
  return get;
}

export function useScrollPosition(): () => { x: number; y: number } {
  const [get, set] = useState({ x: window.scrollX, y: window.scrollY });
  useEffect(() => {
    const onScroll = () => set({ x: window.scrollX, y: window.scrollY });
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  return get;
}

export function useIdleTimer(timeout: number = 60000): () => boolean {
  const [get, set] = useState(false);
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    const reset = () => {
      set(false);
      clearTimeout(timer);
      timer = setTimeout(() => set(true), timeout);
    };
    const events = ['mousemove', 'mousedown', 'keydown', 'touchstart', 'scroll'];
    for (const ev of events) window.addEventListener(ev, reset);
    reset();
    return () => {
      clearTimeout(timer);
      for (const ev of events) window.removeEventListener(ev, reset);
    };
  }, [timeout]);
  return get;
}

export type ValidationRule<T> = {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: T) => string | null;
};

export type ValidationRules<T extends Record<string, unknown>> = {
  [K in keyof T]?: ValidationRule<T[K]>;
};

export type FormErrors<T extends Record<string, unknown>> = Partial<Record<keyof T, string>>;

export function useForm<T extends Record<string, unknown>>(options: {
  initialValues: T;
  validate?: ValidationRules<T>;
  onSubmit?: (values: T) => void;
}) {
  const fields = new Map<keyof T, [() => T[keyof T], (v: T[keyof T]) => void]>();
  const [errors, setErrors] = useState<FormErrors<T>>({});
  const [submitted, setSubmitted] = useState(false);

  const keys = Object.keys(options.initialValues) as (keyof T)[];
  for (let i = 0; i < keys.length; i++) {
    const key = keys[i];
    const [get, set] = useState<T[keyof T]>(options.initialValues[key]);
    fields.set(key, [get, set]);
  }

  const getValues = (): T => {
    const values = {} as T;
    for (const [key, [get]] of fields) {
      values[key] = get();
    }
    return values;
  };

  const validateField = (key: keyof T, value: T[keyof T]): string | null => {
    const rules = options.validate?.[key];
    if (!rules) return null;
    if (rules.required && !value) return 'Required';
    if (rules.minLength && typeof value === 'string' && (value as string).length < rules.minLength) return `Min ${rules.minLength} chars`;
    if (rules.maxLength && typeof value === 'string' && (value as string).length > rules.maxLength) return `Max ${rules.maxLength} chars`;
    if (rules.pattern && typeof value === 'string' && !rules.pattern.test(value as string)) return 'Invalid format';
    if (rules.custom) return rules.custom(value);
    return null;
  };

  const validateAll = (): boolean => {
    const values = getValues();
    const newErrors: FormErrors<T> = {};
    let valid = true;
    for (const key of keys) {
      const err = validateField(key, values[key]);
      if (err) {
        newErrors[key] = err;
        valid = false;
      }
    }
    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = () => {
    setSubmitted(true);
    if (validateAll()) {
      options.onSubmit?.(getValues());
    }
  };

  const setValue = (key: keyof T, value: T[keyof T]) => {
    const field = fields.get(key);
    if (field) {
      field[1](value);
      if (submitted()) {
        const err = validateField(key, value);
        setErrors(prev => {
          const next = { ...prev };
          if (err) next[key] = err;
          else delete next[key];
          return next;
        });
      }
    }
  };

  return {
    values: getValues,
    errors: () => errors(),
    submitted: () => submitted(),
    setValue,
    handleSubmit,
    validate: validateAll,
    field(key: keyof T) {
      const field = fields.get(key);
      return {
        value: field?.[0] || (() => undefined as T[keyof T]),
        set: (v: T[keyof T]) => setValue(key, v),
        error: () => errors()[key],
      };
    },
  };
}

export function useRef<T = Element>(initialValue: T | null = null): { current: T | null } {
  const ctx = getCurrentContext();
  if (!ctx) throw new Error('useRef must be called inside a component');

  const refIndex = ctx.effectIndex++;
  if (!ctx.refCache) {
    ctx.refCache = [];
  }

  let ref = ctx.refCache[refIndex] as { current: T | null } | undefined;
  if (!ref) {
    ref = { current: initialValue };
    ctx.refCache[refIndex] = ref;
  }

  return ref;
}

function depsEqual(a: unknown[], b: unknown[]): boolean {
  if (!a || !b || a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (!Object.is(a[i], b[i])) return false;
  }
  return true;
}

export function useVirtualList<T>(options: {
  items: () => T[];
  itemHeight: number;
  overscan?: number;
  containerRef: HTMLElement | null;
}): {
  visibleItems: () => Array<{ item: T; index: number; offsetY: number }>;
  totalHeight: () => number;
  scrollTo: (index: number) => void;
} {
  const container = options.containerRef;
  const [scrollTop, setScrollTop] = useState(0);
  const overscan = options.overscan ?? 5;

  useEffect(() => {
    if (!container) return;
    const onScroll = () => setScrollTop(container.scrollTop);
    container.addEventListener('scroll', onScroll, { passive: true });
    return () => container.removeEventListener('scroll', onScroll);
  }, [container]);

  const totalHeight = () => options.items().length * options.itemHeight;

  const visibleItems = () => {
    const items = options.items();
    const st = scrollTop();
    const ch = container?.clientHeight ?? 0;
    const startIdx = Math.max(0, Math.floor(st / options.itemHeight) - overscan);
    const endIdx = Math.min(items.length, Math.ceil((st + ch) / options.itemHeight) + overscan);
    const result: Array<{ item: T; index: number; offsetY: number }> = [];
    for (let i = startIdx; i < endIdx; i++) {
      result.push({ item: items[i], index: i, offsetY: i * options.itemHeight });
    }
    return result;
  };

  const scrollTo = (index: number) => {
    if (container) container.scrollTop = index * options.itemHeight;
  };

  return { visibleItems, totalHeight, scrollTo };
}

export function createEffect<T>(
  sourceOrFn: Signal<unknown> | (() => unknown),
  fn?: (value: T) => void
): () => void {
  if (typeof sourceOrFn === 'function' && !fn) {
    const compute = sourceOrFn as () => unknown;
    const runner = () => {
      pushTrackingEffect(runner);
      try {
        compute();
      } finally {
        popTrackingEffect();
      }
    };
    runner();
    return () => {};
  }

  const source = sourceOrFn as Signal<unknown>;
  const callback = fn as (value: T) => void;
  callback(source.get() as T);
  return source.subscribe((v: unknown) => callback(v as T));
}
