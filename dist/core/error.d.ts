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
export declare function createErrorBoundary(fallback: VNode | ((error: Error) => VNode), onError?: (error: Error, info: ErrorInfo) => void): ErrorBoundaryComponent;
export declare function handleComponentError(error: unknown, errorHandler?: ErrorHandler): VNode | null;
export declare function setGlobalErrorHandler(handler: ErrorHandler | undefined): void;
export declare function getGlobalErrorHandler(): ErrorHandler | undefined;
export declare function reportError(error: unknown): void;
//# sourceMappingURL=error.d.ts.map