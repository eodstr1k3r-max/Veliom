export function Suspense(props) {
    const isLazy = 'load' in props.children;
    if (isLazy) {
        const lazyComp = props.children;
        if (lazyComp.loaded) {
            return lazyComp.render({});
        }
        if (lazyComp.error) {
            return props.fallback || { type: 'empty', props: {} };
        }
        lazyComp.load().catch(() => { });
        return props.fallback || { type: 'empty', props: {} };
    }
    const renderFn = props.children;
    return renderFn({});
}
export function createSuspense(fallback) {
    return {
        Suspense: (props) => {
            return Suspense({ ...props, fallback });
        },
        preload: (component) => {
            component.load();
        },
    };
}
