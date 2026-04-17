export function createSignal(initialValue) {
    let value = initialValue;
    const listeners = [];
    return {
        get() {
            return value;
        },
        set(newValue) {
            if (Object.is(value, newValue))
                return;
            value = newValue;
            for (let i = 0; i < listeners.length; i++) {
                listeners[i](value);
            }
        },
        update(fn) {
            this.set(fn(value));
        },
        subscribe(listener) {
            listeners.push(listener);
            return () => {
                const idx = listeners.indexOf(listener);
                if (idx > -1)
                    listeners.splice(idx, 1);
            };
        },
    };
}
export function createStore(initialState) {
    const keys = Object.keys(initialState);
    const signals = new Map();
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        signals.set(key, createSignal(initialState[key]));
    }
    return {
        get(key) {
            return signals.get(key)?.get();
        },
        set(key, value) {
            signals.get(key)?.set(value);
        },
        update(key, fn) {
            const signal = signals.get(key);
            if (signal)
                signal.update(fn);
        },
        subscribe(key, listener) {
            return signals.get(key)?.subscribe(listener) ?? (() => { });
        },
        getState() {
            const state = {};
            for (let i = 0; i < keys.length; i++) {
                const key = keys[i];
                state[key] = signals.get(key)?.get();
            }
            return Object.freeze(state);
        },
    };
}
export function createComputed(compute, dependencies) {
    let value = compute();
    let stale = false;
    const update = () => {
        stale = true;
        const newValue = compute();
        if (!Object.is(value, newValue)) {
            value = newValue;
        }
        stale = false;
    };
    for (let i = 0; i < dependencies.length; i++) {
        dependencies[i].subscribe(update);
    }
    return {
        get() {
            return value;
        },
    };
}
