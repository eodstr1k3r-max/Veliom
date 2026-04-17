export function createErrorBoundary(fallback, onError) {
    return {
        render(state) {
            if (state.hasError && state.error) {
                if (typeof fallback === 'function') {
                    return fallback(state.error);
                }
                return fallback;
            }
            return { type: 'empty', props: {} };
        },
        getDerivedStateFromError(error) {
            return { hasError: true, error };
        },
        componentDidCatch(error, info) {
            onError?.(error, info);
        },
    };
}
export function handleComponentError(error, errorHandler) {
    if (!errorHandler)
        return null;
    const errorObj = error instanceof Error ? error : new Error(String(error));
    return errorHandler(errorObj, {});
}
let globalErrorHandler;
export function setGlobalErrorHandler(handler) {
    globalErrorHandler = handler;
}
export function getGlobalErrorHandler() {
    return globalErrorHandler;
}
export function reportError(error) {
    if (globalErrorHandler) {
        const errorObj = error instanceof Error ? error : new Error(String(error));
        globalErrorHandler(errorObj, {});
    }
    else {
        console.error(error);
    }
}
