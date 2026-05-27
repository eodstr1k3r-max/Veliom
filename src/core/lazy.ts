import { Component, ComponentProps } from '../core/component';
import { createSignal } from '../state/store';

export interface LazyOptions {
  fallback?: import('../core/renderer').VNode;
  errorBoundary?: import('../core/error').ErrorBoundaryComponent;
}

export interface LazyComponent<P = ComponentProps> extends Component<P> {
  load: () => Promise<{ default: Component<P> }>;
  loaded: boolean;
  error: Error | null;
}

export function lazy<P = ComponentProps>(
  loader: () => Promise<{ default: Component<P> }>,
  options: LazyOptions = {}
): LazyComponent<P> {
  const loadedSignal = createSignal(false);
  const errorSignal = createSignal<Error | null>(null);
  let loadedModule: { default: Component<P> } | null = null;
  let loadPromise: Promise<{ default: Component<P> }> | null = null;

  const component: LazyComponent<P> = {
    load: () => {
      if (loadedModule) {
        return Promise.resolve(loadedModule);
      }

      if (loadPromise) {
        return loadPromise;
      }

      loadPromise = loader()
        .then((module) => {
          loadedModule = module;
          loadedSignal.set(true);
          return module;
        })
        .catch((err) => {
          const errorObj = err instanceof Error ? err : new Error(String(err));
          errorSignal.set(errorObj);
          throw err;
        });

      return loadPromise;
    },
    get loaded() {
      return loadedSignal.get();
    },
    get error() {
      return errorSignal.get();
    },
    render: (props: P) => {
      const isLoaded = loadedSignal.get();
      const loadError = errorSignal.get();

      if (!isLoaded) {
        component.load().catch(() => {});
        return options.fallback || { type: 'empty', props: {} };
      }

      if (loadError && options.errorBoundary) {
        return options.errorBoundary.render({
          hasError: true,
          error: loadError,
        });
      }

      if (loadedModule) {
        return loadedModule.default.render(props);
      }

      return { type: 'empty', props: {} };
    },
  };

  return component;
}

export function preload<P = ComponentProps>(
  component: LazyComponent<P>
): Promise<{ default: Component<P> }> {
  return component.load();
}
