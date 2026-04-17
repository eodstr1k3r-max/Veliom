export function Fragment(props) {
    return {
        type: 'fragment',
        props: {},
        children: props.children,
    };
}
export function Show(props) {
    if (props.when) {
        return typeof props.children === 'function' ? props.children() : props.children;
    }
    return props.fallback || { type: 'empty', props: {} };
}
export function For(props) {
    const children = [];
    for (let i = 0; i < props.each.length; i++) {
        children.push(props.children(props.each[i], i));
    }
    return {
        type: 'fragment',
        props: {},
        children,
    };
}
export function Index(props) {
    const children = [];
    for (let i = 0; i < props.each.length; i++) {
        const getter = () => props.each[i];
        children.push(props.children(getter, i));
    }
    return {
        type: 'fragment',
        props: {},
        children,
    };
}
