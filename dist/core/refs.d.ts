export type RefCallback<T> = (element: T | null) => void;
export type Ref<T = Element> = RefCallback<T> | {
    current: T | null;
};
export declare function mergeRefs<T>(...refs: Ref<T>[]): RefCallback<T>;
export declare function createRef<T = Element>(): RefObject<T>;
export interface RefObject<T = Element> {
    current: T | null;
}
//# sourceMappingURL=refs.d.ts.map