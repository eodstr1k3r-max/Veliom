export interface VNode {
  type: string | any;
  props: Record<string, unknown>;
  children?: VNode[];
  key?: string;
  ref?: Element;
}

export interface DOMNode {
  type: string;
  element: Element | Text;
  vnode: VNode;
}

export interface ComponentProps {
  children?: VNode[];
  [key: string]: unknown;
}

export type ComponentRender<P = ComponentProps> = (props: P) => VNode | (() => VNode);

export interface Component<P = ComponentProps> {
  render: (props: P) => VNode;
}

export type ComponentInstance = {
  vnode: VNode | null;
  container: Element | null;
  component: Component<ComponentProps>;
  props: ComponentProps;
};

export type Listener<T> = (value: T) => void;

export interface Signal<T> {
  get(): T;
  set(value: T): void;
  update(fn: (value: T) => T): void;
  subscribe(listener: Listener<T>): () => void;
}

export interface Store<T extends object> {
  get<K extends keyof T>(key: K): T[K];
  set<K extends keyof T>(key: K, value: T[K]): void;
  update<K extends keyof T>(key: K, fn: (value: T[K]) => T[K]): void;
  subscribe<K extends keyof T>(key: K, listener: Listener<T[K]>): () => void;
  getState(): Readonly<T>;
}

export interface Computed<T> {
  get(): T;
}

export type RefCallback<T> = (element: T | null) => void;
export type Ref<T = Element> = RefCallback<T> | { current: T | null };
export interface RefObject<T = Element> {
  current: T | null;
}

export interface ErrorInfo {
  componentStack?: string;
}

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export type ErrorHandler = (error: Error, info: ErrorInfo) => VNode;

export interface ErrorBoundaryComponent {
  render: (state: ErrorBoundaryState) => VNode;
  getDerivedStateFromError?: (error: Error) => Partial<ErrorBoundaryState>;
  componentDidCatch?: (error: Error, info: ErrorInfo) => void;
}

export interface PortalProps {
  children: VNode;
  target?: Element;
}

export interface BenchmarkResult {
  name: string;
  iterations: number;
  totalTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;
  opsPerSecond: number;
}

export interface BenchmarkOptions {
  iterations?: number;
  warmup?: number;
}

export type CleanupFn = () => void;
export type EffectFn = () => CleanupFn | void;

export function h(
  type: string | any,
  props?: Record<string, unknown> | null,
  ...children: (VNode | string | number | null | undefined)[]
): VNode;

export function render(vnode: VNode, container: Element): void;

export function patch(container: Element, oldVNode: VNode, newVNode: VNode): void;

export function setEventContainer(container: Element): void;

export function createComponent<P = ComponentProps>(
  renderFn: ComponentRender<P>
): Component<P>;

export function mount<P = ComponentProps>(
  component: Component<P> | ComponentRender<P>,
  container: Element,
  props?: P
): void;

export function update<P = ComponentProps>(
  container: Element,
  newProps: Partial<P>
): void;

export function unmount(container: Element): void;

export interface Context<T> {
  id: symbol;
  defaultValue: T;
  Provider: { render: (props: { value: T; children?: any }) => any };
}

export function createContext<T>(defaultValue: T): Context<T>;
export function useContext<T>(context: Context<T>): T;
export function provideContext<T>(context: Context<T>, value: T): void;

export function memo<P = ComponentProps>(renderFn: ComponentRender<P>): Component<P>;

export function createSignal<T>(initialValue: T): Signal<T>;

export function createStore<T extends object>(initialState: T): Store<T>;

export function createDeepStore<T extends Record<string, unknown>>(initial: T): {
  state: T;
  subscribe: (fn: () => void) => () => void;
};

export function createComputed<T>(
  compute: () => T,
  dependencies?: Signal<unknown>[]
): Computed<T>;

export type Memo<T> = Computed<T>;

export function createMemo<T>(compute: () => T): Memo<T>;

export function createMediaQuery(query: string): Signal<boolean>;

export function batch(fn: () => void): void;

export interface ResourceState<T> {
  loading: boolean;
  error: Error | null;
  data: T | undefined;
}

export interface Resource<T> {
  get(): ResourceState<T>;
  loading(): boolean;
  error(): Error | null;
  data(): T | undefined;
  mutate(value: T): void;
  refetch(): void;
}

export function createResource<T>(
  fetcher: () => Promise<T> | T,
  source?: Signal<unknown>
): Resource<T>;

export function useEffect(fn: EffectFn, deps?: unknown[]): void;

export function useMemo<T>(fn: () => T, deps: unknown[]): T;

export function useCallback<T extends (...args: unknown[]) => unknown>(
  fn: T,
  deps: unknown[]
): T;

export function useState<T>(
  initialValue: T
): [() => T, (value: T | ((prev: T) => T)) => void];

export function useReducer<T, A>(
  reducer: (state: T, action: A) => T,
  initialValue: T
): [() => T, (action: A) => void];

export function useRef<T = Element>(initialValue?: T | null): { current: T | null };

export function usePrevious<T>(value: T): () => T | undefined;

export function useDebouncedValue<T>(value: () => T, delay?: number): () => T;

export function useEventListener<K extends keyof HTMLElementEventMap>(
  target: Element | Window | Document | null,
  event: K,
  handler: (e: HTMLElementEventMap[K]) => void,
  options?: boolean | AddEventListenerOptions
): void;

export function useInterval(fn: () => void, delay: number | null): void;

export function useTimeout(fn: () => void, delay: number | null): void;

export function useMediaQuery(query: string): () => boolean;

export function useLocalStorage<T>(key: string, defaultValue: T): [() => T, (value: T) => void];

export function useTransition(): [() => boolean, (fn: () => void) => void];

export function createEffect<T>(
  sourceOrFn: Signal<unknown> | (() => unknown),
  fn?: (value: T) => void
): () => void;

export function onMount(fn: () => void | CleanupFn): void;

export function onUpdate(fn: (prevProps: ComponentProps) => void): void;

export function onUnmount(fn: CleanupFn): void;

export function registerLifecycle(
  instance: ComponentInstance,
  callbacks: { onMount?: () => void | CleanupFn; onUpdate?: (prevProps: ComponentProps) => void; onUnmount?: CleanupFn }
): void;

export function unregisterLifecycle(instance: ComponentInstance): void;

export function getLifecycle(instance: ComponentInstance): { onMount?: () => void | CleanupFn; onUpdate?: (prevProps: ComponentProps) => void; onUnmount?: CleanupFn } | undefined;

export function createRef<T = Element>(): RefObject<T>;

export function mergeRefs<T>(...refs: Ref<T>[]): RefCallback<T>;

export function Fragment(props: { children?: VNode[] }): VNode;

export function Show(props: {
  when: boolean;
  children: VNode | (() => VNode);
  fallback?: VNode;
}): VNode;

export function For<T>(props: {
  each: T[];
  children: (item: T, index: number) => VNode;
  key?: (item: T, index: number) => string | number;
}): VNode;

export function Index<T>(props: {
  each: T[];
  children: (item: () => T, index: number) => VNode;
  key?: (item: T, index: number) => string | number;
}): VNode;

export function Switch(props: {
  children: VNode | VNode[];
  fallback?: VNode;
}): VNode;

export function Match(props: {
  when: boolean;
  children?: VNode | (() => VNode);
}): VNode;

export interface AwaitProps<T> {
  promise: Promise<T> | (() => Promise<T>);
  children: (data: T) => VNode;
  loading?: VNode | (() => VNode);
  error?: (error: Error) => VNode;
}

export function Await<T>(props: AwaitProps<T>): VNode;

export interface TeleportProps {
  to: string | Element;
  children?: VNode;
}

export function Teleport(props: TeleportProps): VNode;

export function createErrorBoundary(
  fallback: VNode | ((error: Error) => VNode),
  onError?: (error: Error, info: ErrorInfo) => void
): ErrorBoundaryComponent;

export function ErrorBoundary(props: {
  fallback: VNode | ((error: Error) => VNode);
  children?: VNode | VNode[] | (() => VNode | VNode[]);
  onError?: (error: Error, info: ErrorInfo) => void;
}): VNode;

export function createPortal(props: PortalProps): VNode;

export function setPortalContainer(container: Element): void;

export function setGlobalErrorHandler(handler: ErrorHandler | undefined): void;

export function getGlobalErrorHandler(): ErrorHandler | undefined;

export function reportError(error: unknown): void;

export function handleComponentError(
  error: unknown,
  errorHandler?: ErrorHandler
): VNode | null;

export function benchmark(
  name: string,
  fn: () => void,
  options?: BenchmarkOptions
): BenchmarkResult;

export function compareBenchmarks(...benchmarks: BenchmarkResult[]): void;

export function runPerformanceTests(): void;

export interface LazyOptions {
  fallback?: VNode;
  errorBoundary?: ErrorBoundaryComponent;
}

export interface LazyComponent<P = ComponentProps> extends Component<P> {
  load: () => Promise<{ default: Component<P> }>;
  loaded: boolean;
  error: Error | null;
}

export function lazy<P = ComponentProps>(
  loader: () => Promise<{ default: Component<P> }>,
  options?: LazyOptions
): LazyComponent<P>;

export function preload<P = ComponentProps>(component: LazyComponent<P>): Promise<{ default: Component<P> }>;

export interface SuspenseProps {
  children: LazyComponent | ComponentRender;
  fallback?: VNode;
}

export function Suspense(props: SuspenseProps): VNode;

export interface DynamicProps {
  component?: string | ((props: Record<string, unknown>) => VNode);
  children?: VNode | VNode[];
  [key: string]: unknown;
}

export function Dynamic(props: DynamicProps): VNode;

export function toArray(children: VNode | VNode[] | undefined | null): VNode[];
export function childrenMap<T>(children: VNode | VNode[] | undefined | null, fn: (child: VNode, index: number) => T): T[];
export function childrenForEach(children: VNode | VNode[] | undefined | null, fn: (child: VNode, index: number) => void): void;
export function childrenOnly(children: VNode | VNode[] | undefined | null): VNode;
export function childrenCount(children: VNode | VNode[] | undefined | null): number;
export const Children: {
  toArray: typeof toArray;
  map: typeof childrenMap;
  forEach: typeof childrenForEach;
  only: typeof childrenOnly;
  count: typeof childrenCount;
};

export function onClickOutside(
  element: Element | null,
  callback: () => void,
  enabled?: boolean
): () => void;

export interface RouteDefinition {
  path: string;
  component: () => VNode;
}

export interface RouterOptions {
  mode?: 'hash' | 'history';
  base?: string;
}

export interface Router {
  currentPath: Signal<string>;
  params: Signal<Record<string, string>>;
  navigate: (path: string) => void;
  resolve: (path: string) => string;
  dispose: () => void;
}

export function createRouter(routes: RouteDefinition[], options?: RouterOptions): Router;

export function Route(props: {
  path: string;
  component: () => VNode;
  router: Router;
  fallback?: VNode;
}): VNode;

export function Link(props: {
  to: string;
  router: Router;
  children?: VNode | VNode[];
  class?: string;
  [key: string]: unknown;
}): VNode;

export function useRouter(router: Router): {
  path: () => string;
  params: () => Record<string, string>;
  navigate: (path: string) => void;
};

export function combineSignals<T>(sources: Signal<unknown>[], compute: () => T): Signal<T>;

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

export function useIntersectionObserver(
  target: Element | null | undefined,
  options?: IntersectionObserverInit
): () => IntersectionObserverEntry | null;

export function useResizeObserver(
  target: Element | null | undefined
): () => DOMRectReadOnly | null;

export function useClipboard(): {
  copy: (text: string) => Promise<boolean>;
  copied: () => boolean;
};

export function useDocumentTitle(title: string): void;

export function useOnlineStatus(): () => boolean;

export function usePreferredColorScheme(): () => 'light' | 'dark';

export function useGeolocation(options?: PositionOptions): {
  coords: () => GeolocationCoordinates | null;
  error: () => string | null;
  loading: () => boolean;
};

export function useWindowSize(): () => { width: number; height: number };

export function useKeyPress(targetKey: string): () => boolean;

export function useHover(element: HTMLElement | null | undefined): () => boolean;

export function useScrollPosition(): () => { x: number; y: number };

export function useIdleTimer(timeout?: number): () => boolean;

export function useForm<T extends Record<string, unknown>>(options: {
  initialValues: T;
  validate?: ValidationRules<T>;
  onSubmit?: (values: T) => void;
}): {
  values: () => T;
  errors: () => FormErrors<T>;
  submitted: () => boolean;
  setValue: (key: keyof T, value: T[keyof T]) => void;
  handleSubmit: () => void;
  validate: () => boolean;
  field: (key: keyof T) => {
    value: () => T[keyof T];
    set: (v: T[keyof T]) => void;
    error: () => string | undefined;
  };
};

export interface AsyncState<T> {
  data: () => T | undefined;
  loading: () => boolean;
  error: () => Error | undefined;
  refetch: () => void;
}

export function createAsync<T>(
  fetcher: () => Promise<T> | T,
  initial?: T
): AsyncState<T>;
