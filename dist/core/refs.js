export function mergeRefs(...refs) {
    return (element) => {
        for (let i = 0; i < refs.length; i++) {
            const ref = refs[i];
            if (typeof ref === 'function') {
                ref(element);
            }
            else if (ref && 'current' in ref) {
                ref.current = element;
            }
        }
    };
}
export function createRef() {
    return { current: null };
}
