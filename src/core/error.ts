import { VNode } from './renderer';

export interface ErrorInfo {
  componentStack?: string;
}

export type ErrorHandler = (error: Error, info: ErrorInfo) => VNode;

export interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export interface ErrorBoundaryComponent {
  render: (state: ErrorBoundaryState) => VNode;
  getDerivedStateFromError?: (error: Error) => Partial<ErrorBoundaryState>;
  componentDidCatch?: (error: Error, info: ErrorInfo) => void;
}

export function createErrorBoundary(
  fallback: VNode | ((error: Error) => VNode),
  onError?: (error: Error, info: ErrorInfo) => void
): ErrorBoundaryComponent {
  return {
    render(state: ErrorBoundaryState): VNode {
      if (state.hasError && state.error) {
        if (typeof fallback === 'function') {
          return fallback(state.error);
        }
        return fallback;
      }
      return { type: 'empty', props: {} };
    },
    getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
      return { hasError: true, error };
    },
    componentDidCatch(error: Error, info: ErrorInfo): void {
      onError?.(error, info);
    },
  };
}

export function handleComponentError(
  error: unknown,
  errorHandler?: ErrorHandler
): VNode | null {
  if (!errorHandler) return null;

  const errorObj = error instanceof Error ? error : new Error(String(error));
  return errorHandler(errorObj, {});
}

let globalErrorHandler: ErrorHandler | undefined;

export function setGlobalErrorHandler(handler: ErrorHandler | undefined): void {
  globalErrorHandler = handler;
}

export function getGlobalErrorHandler(): ErrorHandler | undefined {
  return globalErrorHandler;
}

export function reportError(error: unknown): void {
  if (globalErrorHandler) {
    const errorObj = error instanceof Error ? error : new Error(String(error));
    globalErrorHandler(errorObj, {});
  } else {
    console.error(error);
  }
}

export function ErrorBoundary(props: {
  fallback: VNode | ((error: Error) => VNode);
  children?: VNode | VNode[] | (() => VNode | VNode[]);
  onError?: (error: Error, info: ErrorInfo) => void;
}): VNode {
  const { fallback, children, onError } = props;
  let result: VNode | VNode[];
  try {
    result = typeof children === 'function' ? (children as () => VNode | VNode[])() : (children || { type: 'empty', props: {} });
  } catch (err) {
    const errorObj = err instanceof Error ? err : new Error(String(err));
    if (onError) {
      try { onError(errorObj, {}); } catch {}
    }
    return typeof fallback === 'function' ? fallback(errorObj) : fallback;
  }
  return Array.isArray(result) ? { type: 'fragment', props: {}, children: result } : result;
}
