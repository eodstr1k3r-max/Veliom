export function lazy(loader, options = {}) {
    let loadedModule = null;
    let loadPromise = null;
    let loadError = null;
    let isLoaded = false;
    const component = {
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
        render: (props) => {
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
export function preload(component) {
    return component.load();
}
