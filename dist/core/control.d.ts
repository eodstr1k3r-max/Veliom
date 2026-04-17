import { VNode } from './renderer';
export declare function Fragment(props: {
    children?: VNode[];
}): VNode;
export declare function Show(props: {
    when: boolean;
    children: VNode | (() => VNode);
    fallback?: VNode;
}): VNode;
export declare function For<T>(props: {
    each: T[];
    children: (item: T, index: number) => VNode;
}): VNode;
export declare function Index<T>(props: {
    each: T[];
    children: (item: () => T, index: number) => VNode;
}): VNode;
//# sourceMappingURL=control.d.ts.map