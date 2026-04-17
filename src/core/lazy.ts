import { Component, ComponentProps, ComponentRender } from '../core/component';

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
  let loadedModule: { default: Component<P> } | null = null;
  let loadPromise: Promise<{ default: Component<P> }> | null = null;
  let loadError: Error | null = null;
  let isLoaded = false;

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
          isLoaded = true;
          return module;
        })
        .catch((err) => {
          loadError = err instanceof Error ? err : new Error(String(err));
          throw err;
        });

      return loadPromise;
    },
    get loaded() {
      return isLoaded;
    },
    get error() {
      return loadError;
    },
    render: (props: P) => {
      if (!isLoaded) {
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
