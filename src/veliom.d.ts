export interface VNode {
  type: string;
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

export type ComponentRender<P = ComponentProps> = (props: P) => VNode;

export interface Component<P = ComponentProps> {
  render: ComponentRender<P>;
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
  type: string,
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
  component: Component<P>,
  container: Element,
  props?: P
): void;

export function update<P = ComponentProps>(
  container: Element,
  newProps: Partial<P>
): void;

export function unmount(container: Element): void;

export function createSignal<T>(initialValue: T): Signal<T>;

export function createStore<T extends object>(initialState: T): Store<T>;

export function createComputed<T>(
  compute: () => T,
  dependencies: Signal<unknown>[]
): Computed<T>;

export function useEffect(fn: EffectFn, deps?: unknown[]): void;

export function useMemo<T>(fn: () => T, deps: unknown[]): T;

export function useCallback<T extends (...args: unknown[]) => unknown>(
  fn: T,
  deps: unknown[]
): T;

export function useState<T>(
  initialValue: T
): [() => T, (value: T | ((prev: T) => T)) => void];

export function createEffect<T>(
  source: Signal<unknown>,
  fn: (value: T) => void
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
}): VNode;

export function Index<T>(props: {
  each: T[];
  children: (item: () => T, index: number) => VNode;
}): VNode;

export function createErrorBoundary(
  fallback: VNode | ((error: Error) => VNode),
  onError?: (error: Error, info: ErrorInfo) => void
): ErrorBoundaryComponent;

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
