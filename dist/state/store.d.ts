export type Listener<T> = (value: T) => void;
export interface Signal<T> {
    get(): T;
    set(value: T): void;
    update(fn: (value: T) => T): void;
    subscribe(listener: Listener<T>): () => void;
}
export declare function createSignal<T>(initialValue: T): Signal<T>;
export interface Store<T extends object> {
    get<K extends keyof T>(key: K): T[K];
    set<K extends keyof T>(key: K, value: T[K]): void;
    update<K extends keyof T>(key: K, fn: (value: T[K]) => T[K]): void;
    subscribe<K extends keyof T>(key: K, listener: Listener<T[K]>): () => void;
    getState(): Readonly<T>;
}
export declare function createStore<T extends object>(initialState: T): Store<T>;
export interface Computed<T> {
    get(): T;
}
export declare function createComputed<T>(compute: () => T, dependencies: Signal<unknown>[]): Computed<T>;
//# sourceMappingURL=store.d.ts.map