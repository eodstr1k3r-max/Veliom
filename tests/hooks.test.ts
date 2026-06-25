import { describe, it, expect, vi } from 'vitest';
import {
  pushComponentContext,
  popComponentContext,
  getCurrentContext,
  useEffect,
  useMemo,
  useCallback,
  useState,
  useRef,
  useReducer,
  useTransition,
  usePrevious,
  useDebouncedValue,
  useEventListener,
  useInterval,
  useTimeout,
  useMediaQuery,
  useLocalStorage,
  useForm,
  useIntersectionObserver,
  useResizeObserver,
  useClipboard,
  useDocumentTitle,
  useOnlineStatus,
  usePreferredColorScheme,
  useGeolocation,
  useWindowSize,
  useKeyPress,
  useHover,
  useScrollPosition,
  useIdleTimer,
  createEffect,
  cleanupEffects,
} from '../src/state/hooks';
import { createSignal } from '../src/state/store';

function withContext<T>(fn: () => T): T {
  pushComponentContext();
  try {
    return fn();
  } finally {
    popComponentContext();
  }
}

function flushMicrotasks(): Promise<void> {
  return Promise.resolve();
}

describe('useState', () => {
  it('returns initial value', () => {
    withContext(() => {
      const [get] = useState(10);
      expect(get()).toBe(10);
    });
  });

  it('updates value via setter', () => {
    withContext(() => {
      const [get, set] = useState(0);
      set(5);
      expect(get()).toBe(5);
    });
  });

  it('updates value via functional setter', () => {
    withContext(() => {
      const [get, set] = useState(0);
      set(prev => prev + 1);
      expect(get()).toBe(1);
    });
  });

  it('persists state across multiple reads', () => {
    withContext(() => {
      const [get, set] = useState(42);
      expect(get()).toBe(42);
      set(100);
      expect(get()).toBe(100);
      expect(get()).toBe(100);
    });
  });
});

describe('useRef', () => {
  it('returns a ref object with null default', () => {
    withContext(() => {
      const ref = useRef();
      expect(ref).toHaveProperty('current');
      expect(ref.current).toBeNull();
    });
  });

  it('returns a ref object with initial value', () => {
    withContext(() => {
      const ref = useRef(42);
      expect(ref.current).toBe(42);
    });
  });

  it('returns the same ref object at same position across renders', () => {
    let refCache: any;
    {
      const ctx = pushComponentContext();
      const ref1 = useRef('hello');
      refCache = ctx.refCache;
      popComponentContext();
      expect(ref1.current).toBe('hello');
    }
    {
      const ctx = pushComponentContext();
      ctx.refCache = refCache;
      ctx.effectIndex = 0;
      const ref2 = useRef('world');
      popComponentContext();
      expect(ref2.current).toBe('hello');
    }
  });
});

describe('useEffect', () => {
  it('schedules effect as microtask', async () => {
    const fn = vi.fn();
    withContext(() => { useEffect(fn); });
    expect(fn).not.toHaveBeenCalled();
    await flushMicrotasks();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('skips effect if deps have not changed across renders', async () => {
    const fn = vi.fn();
    const ctx = pushComponentContext();
    useEffect(fn, [42, 99]);
    popComponentContext();
    await flushMicrotasks();
    expect(fn).toHaveBeenCalledTimes(1);

    const ctx2 = pushComponentContext();
    ctx2.effects = ctx.effects;
    ctx2.memoCache = ctx.memoCache;
    ctx2.effectIndex = 0;
    useEffect(fn, [42, 99]);
    popComponentContext();
    await flushMicrotasks();
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('re-runs effect when deps change', async () => {
    const fn = vi.fn();
    const ctx = pushComponentContext();
    useEffect(fn, [1]);
    popComponentContext();
    await flushMicrotasks();

    const ctx2 = pushComponentContext();
    ctx2.effects = ctx.effects;
    ctx2.memoCache = ctx.memoCache;
    useEffect(fn, [2]);
    popComponentContext();
    await flushMicrotasks();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('useMemo', () => {
  it('returns computed value', () => {
    withContext(() => {
      const result = useMemo(() => 1 + 2, []);
      expect(result).toBe(3);
    });
  });

  it('caches value at same position with same deps across renders', () => {
    const fn = vi.fn(() => Math.random());
    const ctx = pushComponentContext();
    const a = useMemo(fn, [1]);
    popComponentContext();
    expect(fn).toHaveBeenCalledTimes(1);

    const ctx2 = pushComponentContext();
    ctx2.memoCache = ctx.memoCache;
    ctx2.effectIndex = 0;
    const b = useMemo(fn, [1]);
    popComponentContext();
    expect(fn).toHaveBeenCalledTimes(1);
    expect(a).toBe(b);
  });

  it('recomputes when deps change across renders', () => {
    const fn = vi.fn((x: number) => x * 2);
    const ctx = pushComponentContext();
    useMemo(() => fn(1), [1]);
    popComponentContext();

    const ctx2 = pushComponentContext();
    ctx2.memoCache = ctx.memoCache;
    ctx2.effectIndex = 0;
    useMemo(() => fn(2), [2]);
    popComponentContext();
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('useCallback', () => {
  it('returns the same function reference when deps unchanged across renders', () => {
    const ctx = pushComponentContext();
    const fn = () => 42;
    const a = useCallback(fn, []);
    popComponentContext();

    const ctx2 = pushComponentContext();
    ctx2.memoCache = ctx.memoCache;
    ctx2.effectIndex = 0;
    const b = useCallback(fn, []);
    popComponentContext();
    expect(a).toBe(b);
  });
});

describe('useReducer', () => {
  it('returns initial state', () => {
    withContext(() => {
      const reducer = (s: number) => s;
      const [get] = useReducer(reducer, 0);
      expect(get()).toBe(0);
    });
  });

  it('dispatches actions to update state', () => {
    withContext(() => {
      const reducer = (state: number, action: 'inc' | 'dec') => {
        return action === 'inc' ? state + 1 : state - 1;
      };
      const [get, dispatch] = useReducer(reducer, 5);
      dispatch('inc');
      expect(get()).toBe(6);
      dispatch('dec');
      expect(get()).toBe(5);
    });
  });

  it('handles complex state updates', () => {
    withContext(() => {
      interface Todo {
        id: number;
        text: string;
        done: boolean;
      }
      type Action =
        | { type: 'add'; text: string }
        | { type: 'toggle'; id: number };

      const reducer = (state: Todo[], action: Action): Todo[] => {
        if (action.type === 'add') {
          return [...state, { id: state.length + 1, text: action.text, done: false }];
        }
        if (action.type === 'toggle') {
          return state.map(t => t.id === action.id ? { ...t, done: !t.done } : t);
        }
        return state;
      };

      const [get, dispatch] = useReducer(reducer, []);
      dispatch({ type: 'add', text: 'test' });
      expect(get()).toHaveLength(1);
      expect(get()[0].text).toBe('test');

      dispatch({ type: 'toggle', id: 1 });
      expect(get()[0].done).toBe(true);
    });
  });
});

describe('createEffect with auto-tracking', () => {
  it('auto-tracks signal dependencies', () => {
    const s = createSignal(1);
    const fn = vi.fn(() => { s.get(); });
    createEffect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    s.set(2);
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('works with explicit signal + callback', () => {
    const s = createSignal(10);
    const fn = vi.fn();
    createEffect(s, fn);
    expect(fn).toHaveBeenCalledWith(10);
    s.set(20);
    expect(fn).toHaveBeenCalledWith(20);
  });

  it('tracks multiple signals', () => {
    const a = createSignal(1);
    const b = createSignal(2);
    const fn = vi.fn(() => { a.get(); b.get(); });
    createEffect(fn);
    expect(fn).toHaveBeenCalledTimes(1);
    a.set(10);
    expect(fn).toHaveBeenCalledTimes(2);
    b.set(20);
    expect(fn).toHaveBeenCalledTimes(3);
  });

  it('returns unsubscribe function (explicit mode)', () => {
    const s = createSignal(0);
    const fn = vi.fn();
    const unsub = createEffect(s, fn);
    s.set(1);
    expect(fn).toHaveBeenCalledTimes(2);
    unsub();
    s.set(2);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});

describe('useTransition', () => {
  it('starts as not pending', () => {
    withContext(() => {
      const [isPending] = useTransition();
      expect(isPending()).toBe(false);
    });
  });

  it('sets pending during transition', async () => {
    withContext(() => {
      const [isPending, startTransition] = useTransition();
      startTransition(() => {});
      expect(isPending()).toBe(true);
    });
  });

  it('clears pending after transition completes', async () => {
    withContext(() => {
      const [isPending, startTransition] = useTransition();
      startTransition(() => {});
    });
    await flushMicrotasks();
    withContext(() => {
      const [isPending] = useTransition();
      expect(isPending()).toBe(false);
    });
  });
});

describe('usePrevious', () => {
  it('returns undefined on first call', () => {
    withContext(() => {
      const prev = usePrevious(42);
      expect(prev()).toBeUndefined();
    });
  });

  it('returns previous value on subsequent calls', () => {
    withContext(() => {
      const ctx = getCurrentContext()!;
      const prev1 = usePrevious(1);
      expect(prev1()).toBeUndefined();
      ctx.effectIndex = 0;
      const prev2 = usePrevious(2);
      expect(prev2()).toBe(1);
    });
  });
});

describe('useDebouncedValue', () => {
  it('returns initial value immediately', () => {
    withContext(() => {
      const val = useDebouncedValue(() => 42, 1000);
      expect(val()).toBe(42);
    });
  });
});

describe('useEventListener', () => {
  it('registers and cleans up event listener', async () => {
    const fn = vi.fn();
    const el = document.createElement('div');
    const ctx = pushComponentContext();
    useEventListener(el, 'click', fn);
    popComponentContext();
    await flushMicrotasks();
    el.click();
    expect(fn).toHaveBeenCalledTimes(1);
    cleanupEffects(ctx);
    el.click();
    expect(fn).toHaveBeenCalledTimes(1);
  });
});

describe('useInterval', () => {
  it('calls function at interval', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const ctx = pushComponentContext();
    useInterval(fn, 100);
    popComponentContext();
    await flushMicrotasks();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(2);
    cleanupEffects(ctx);
    vi.advanceTimersByTime(200);
    expect(fn).toHaveBeenCalledTimes(2);
    vi.useRealTimers();
  });
});

describe('useTimeout', () => {
  it('calls function after timeout', async () => {
    vi.useFakeTimers();
    const fn = vi.fn();
    const ctx = pushComponentContext();
    useTimeout(fn, 100);
    popComponentContext();
    await flushMicrotasks();
    expect(fn).not.toHaveBeenCalled();
    vi.advanceTimersByTime(100);
    expect(fn).toHaveBeenCalledTimes(1);
    cleanupEffects(ctx);
    vi.useRealTimers();
  });
});

describe('useMediaQuery', () => {
  it('returns a boolean signal', async () => {
    const origMatchMedia = window.matchMedia;
    window.matchMedia = (() => ({ matches: true, addEventListener: () => {}, removeEventListener: () => {} })) as any;
    const ctx = pushComponentContext();
    const get = useMediaQuery('(min-width: 0px)');
    expect(get()).toBe(true);
    popComponentContext();
    await flushMicrotasks();
    cleanupEffects(ctx);
    window.matchMedia = origMatchMedia;
  });
});

describe('useLocalStorage', () => {
  it('returns default value when key not set', () => {
    localStorage.removeItem('test-key');
    const ctx = pushComponentContext();
    const [get] = useLocalStorage('test-key', 'default');
    expect(get()).toBe('default');
    popComponentContext();
    cleanupEffects(ctx);
  });

  it('persists value to localStorage', () => {
    localStorage.removeItem('test-key');
    const ctx = pushComponentContext();
    const [get, set] = useLocalStorage('test-key', 'default');
    set('stored');
    expect(get()).toBe('stored');
    expect(localStorage.getItem('test-key')).toBe('"stored"');
    popComponentContext();
    cleanupEffects(ctx);
    localStorage.removeItem('test-key');
  });
});

describe('useForm', () => {
  it('returns form with initial values', () => {
    const ctx = pushComponentContext();
    const form = useForm({ initialValues: { name: 'test', email: '' } });
    expect(form.values().name).toBe('test');
    expect(form.values().email).toBe('');
    popComponentContext();
    cleanupEffects(ctx);
  });

  it('setValue updates a field', () => {
    const ctx = pushComponentContext();
    const form = useForm({ initialValues: { name: '' } });
    form.setValue('name', 'Alice');
    expect(form.values().name).toBe('Alice');
    popComponentContext();
    cleanupEffects(ctx);
  });

  it('validate runs validation rules', () => {
    const ctx = pushComponentContext();
    const form = useForm({
      initialValues: { name: '' },
      validate: { name: { required: true } },
    });
    expect(form.validate()).toBe(false);
    form.setValue('name', 'Alice');
    expect(form.validate()).toBe(true);
    popComponentContext();
    cleanupEffects(ctx);
  });

  it('field returns value, set, and error', () => {
    const ctx = pushComponentContext();
    const form = useForm({
      initialValues: { email: '' },
      validate: { email: { pattern: /^.+@.+$/ } },
    });
    const f = form.field('email');
    expect(f.value()).toBe('');
    f.set('bad');
    expect(form.values().email).toBe('bad');
    popComponentContext();
    cleanupEffects(ctx);
  });
});

describe('useIntersectionObserver', () => {
  it('returns null initially without target', () => {
    const ctx = pushComponentContext();
    const get = useIntersectionObserver(null);
    expect(get()).toBeNull();
    popComponentContext();
    cleanupEffects(ctx);
  });
});

describe('useClipboard', () => {
  it('returns copy function and copied signal', () => {
    const ctx = pushComponentContext();
    const { copy, copied } = useClipboard();
    expect(typeof copy).toBe('function');
    expect(copied()).toBe(false);
    popComponentContext();
    cleanupEffects(ctx);
  });
});

describe('useDocumentTitle', () => {
  it('sets document title', async () => {
    const ctx = pushComponentContext();
    const prev = document.title;
    useDocumentTitle('Test Title');
    await flushMicrotasks();
    expect(document.title).toBe('Test Title');
    document.title = prev;
    popComponentContext();
    cleanupEffects(ctx);
  });
});

describe('useOnlineStatus', () => {
  it('returns initial online status', () => {
    const ctx = pushComponentContext();
    const get = useOnlineStatus();
    expect(typeof get()).toBe('boolean');
    popComponentContext();
    cleanupEffects(ctx);
  });
});

describe('usePreferredColorScheme', () => {
  it('returns light or dark', () => {
    const ctx = pushComponentContext();
    const get = usePreferredColorScheme();
    const scheme = get();
    expect(scheme === 'light' || scheme === 'dark').toBe(true);
    popComponentContext();
    cleanupEffects(ctx);
  });
});

describe('useGeolocation', () => {
  it('returns loading initially', () => {
    const ctx = pushComponentContext();
    const { coords, error, loading } = useGeolocation();
    expect(loading()).toBe(true);
    expect(coords()).toBeNull();
    expect(error()).toBeNull();
    popComponentContext();
    cleanupEffects(ctx);
  });
});

describe('useWindowSize', () => {
  it('returns window dimensions', () => {
    const ctx = pushComponentContext();
    const get = useWindowSize();
    const size = get();
    expect(typeof size.width).toBe('number');
    expect(typeof size.height).toBe('number');
    popComponentContext();
    cleanupEffects(ctx);
  });
});

describe('useKeyPress', () => {
  it('returns false initially', () => {
    const ctx = pushComponentContext();
    const isPressed = useKeyPress('a');
    expect(isPressed()).toBe(false);
    popComponentContext();
    cleanupEffects(ctx);
  });
});

describe('useHover', () => {
  it('returns false when element is null', () => {
    const ctx = pushComponentContext();
    const isHovered = useHover(null);
    expect(isHovered()).toBe(false);
    popComponentContext();
    cleanupEffects(ctx);
  });
});

describe('useScrollPosition', () => {
  it('returns scroll coordinates', () => {
    const ctx = pushComponentContext();
    const get = useScrollPosition();
    const pos = get();
    expect(typeof pos.x).toBe('number');
    expect(typeof pos.y).toBe('number');
    popComponentContext();
    cleanupEffects(ctx);
  });
});

describe('useIdleTimer', () => {
  it('returns false initially', () => {
    const ctx = pushComponentContext();
    const isIdle = useIdleTimer(1000);
    expect(isIdle()).toBe(false);
    popComponentContext();
    cleanupEffects(ctx);
  });
});

describe('cleanupEffects', () => {
  it('runs cleanup functions', async () => {
    const cleanup = vi.fn();
    const ctx = pushComponentContext();
    useEffect(() => cleanup);
    popComponentContext();
    await flushMicrotasks();
    cleanupEffects(ctx);
    expect(cleanup).toHaveBeenCalled();
  });
});
