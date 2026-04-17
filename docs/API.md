# Veliom - API Reference

## Table of Contents

1. [Core Functions](#core-functions)
2. [State Management](#state-management)
3. [Hooks](#hooks)
4. [Lifecycle](#lifecycle)
5. [Control Flow](#control-flow)
6. [Utilities](#utilities)

---

## Core Functions

### `h(type, props?, ...children)`

Creates a virtual DOM node.

```typescript
import { h } from 'veliom';

// Basic element
h('div', { className: 'container' }, 'Hello')

// Nested elements
h('div', null,
  h('h1', null, 'Title'),
  h('p', null, 'Description')
)

// With event handlers
h('button', { 
  onClick: () => console.log('clicked') 
}, 'Click me')

// With styles
h('div', { 
  style: { color: 'red', fontSize: '16px' } 
})
```

### `render(vnode, container)`

Renders a VNode to a DOM container.

```typescript
import { h, render } from 'veliom';

const vnode = h('div', null, 'Hello World');
render(vnode, document.getElementById('app')!);
```

### `patch(container, oldVNode, newVNode)`

Patches the DOM with a new VNode.

```typescript
import { h, render, patch } from 'veliom';

const oldVNode = h('div', null, 'Old');
render(oldVNode, container);

const newVNode = h('div', null, 'New');
patch(container, oldVNode, newVNode);
```

---

## Components

### `createComponent(renderFn)`

Creates a component that returns a render function.

```typescript
import { createComponent, createSignal, h } from 'veliom';

const Counter = createComponent(() => {
  const count = createSignal(0);

  // Return a function that will be called on updates
  return () => h('div', null,
    h('span', null, String(count.get())),
    h('button', { 
      onClick: () => count.update(n => n + 1) 
    }, '+')
  );
});
```

### `mount(component, container, props?)`

Mounts a component to a DOM container.

```typescript
import { mount } from 'veliom';

mount(Counter, document.getElementById('app')!);
mount(Counter, container, { initialCount: 5 });
```

### `update(container, newProps)`

Updates component props.

```typescript
update(container, { newProp: 'value' });
```

### `unmount(container)`

Unmounts a component from the DOM.

```typescript
unmount(container);
```

---

## State Management

### `createSignal(initialValue)`

Creates a reactive signal.

```typescript
const count = createSignal(0);

// Get value
count.get(); // 0

// Set value
count.set(5); // 5

// Update with function
count.update(n => n + 1); // 6
```

### `createStore(initialState)`

Creates a reactive store with multiple properties.

```typescript
const store = createStore({
  name: 'Veliom',
  count: 0,
  active: true
});

// Get value
store.get('name'); // 'Veliom'

// Set value
store.set('count', 10);

// Update with function
store.update('count', n => n + 1);

// Subscribe to changes
store.subscribe('count', (value) => {
  console.log('Count changed:', value);
});

// Get full state
store.getState(); // { name: 'Veliom', count: 11, active: true }
```

### `createComputed(compute, dependencies)`

Creates a computed value that updates when dependencies change.

```typescript
const firstName = createSignal('John');
const lastName = createSignal('Doe');

const fullName = createComputed(
  () => `${firstName.get()} ${lastName.get()}`,
  [firstName, lastName]
);

fullName.get(); // 'John Doe'
firstName.set('Jane');
fullName.get(); // 'Jane Doe'
```

---

## Hooks

### `useState(initialValue)`

Creates a reactive state within a component.

```typescript
import { useState } from 'veliom';

const MyComponent = createComponent(() => {
  const [getCount, setCount] = useState(0);

  return () => h('div', null,
    h('span', null, String(getCount())),
    h('button', { 
      onClick: () => setCount(c => c + 1) 
    }, '+')
  );
});
```

### `useEffect(fn, deps)`

Runs a side effect when dependencies change.

```typescript
import { useEffect } from 'veliom';

const MyComponent = createComponent(() => {
  const [data, setData] = useState(null);

  useEffect(() => {
    fetch('/api/data')
      .then(res => res.json())
      .then(setData);

    // Cleanup function
    return () => {
      console.log('Component unmounted or effect re-ran');
    };
  }, []); // Empty array = run once on mount

  return () => h('div', null, String(data));
});
```

### `useMemo(fn, deps)`

Memoizes a computed value.

```typescript
import { useMemo } from 'veliom';

const MyComponent = createComponent(() => {
  const [items, setItems] = useState([1, 2, 3, 4, 5]);

  const doubled = useMemo(() => {
    return items().map(n => n * 2);
  }, [items]);

  return () => h('div', null, 
    String(doubled().join(', '))
  );
});
```

### `useCallback(fn, deps)`

Returns a memoized callback function.

```typescript
import { useCallback } from 'veliom';

const MyComponent = createComponent(() => {
  const [count, setCount] = useState(0);

  const handleClick = useCallback(() => {
    console.log('Clicked!', count());
  }, [count]);

  return () => h('button', { onClick: handleClick }, '+');
});
```

---

## Lifecycle

### `onMount(fn)`

Runs a function when the component mounts.

```typescript
import { onMount, onUnmount } from 'veliom';

const MyComponent = createComponent(() => {
  onMount(() => {
    console.log('Component mounted');
    
    // Return cleanup function
    return () => console.log('Component unmounted');
  });

  return () => h('div', null, 'Hello');
});
```

### `onUpdate(fn)`

Runs a function when props update.

```typescript
onUpdate((prevProps) => {
  console.log('Props changed from:', prevProps);
});
```

### `onUnmount(fn)`

Runs a function when the component unmounts.

```typescript
onUnmount(() => {
  console.log('Cleanup!');
});
```

---

## Control Flow

### `Fragment`

Renders multiple elements without a wrapper.

```typescript
import { Fragment, h } from 'veliom';

Fragment({
  children: [
    h('h1', null, 'Title'),
    h('p', null, 'Description')
  ]
})
```

### `Show`

Conditionally renders content.

```typescript
import { Show, h } from 'veliom';

Show({
  when: isLoggedIn,
  children: () => h('div', null, 'Welcome!'),
  fallback: h('div', null, 'Please login')
})
```

### `For`

Renders a list of items.

```typescript
import { For, h } from 'veliom';

For({
  each: items,
  children: (item, index) => 
    h('div', { key: item.id },
      h('span', null, `${index + 1}. ${item.name}`)
    )
})
```

### `Index`

Renders a list with stable index access.

```typescript
import { Index, h } from 'veliom';

Index({
  each: items,
  children: (getItem, index) => 
    h('div', { key: String(index) },
      h('span', null, getItem().name)
    )
})
```

---

## Utilities

### `createRef()`

Creates a ref object for DOM access.

```typescript
import { createRef, mergeRefs } from 'veliom';

const inputRef = createRef<HTMLInputElement>();

const MyComponent = createComponent(() => {
  return () => h('input', { 
    ref: inputRef,
    type: 'text'
  });
});

// Access DOM element
inputRef.current?.focus();
```

### `mergeRefs(...refs)`

Merges multiple refs into one.

```typescript
mergeRefs(ref1, ref2, ref3);
```

### `createPortal(props)`

Renders children to a different DOM location.

```typescript
import { createPortal, h } from 'veliom';

createPortal({
  children: h('div', { className: 'modal' }, 'Modal'),
  target: document.body
});
```

### `lazy(loader, options)`

Creates a lazily-loaded component.

```typescript
import { lazy, Suspense, h } from 'veliom';

const LazyComponent = lazy(
  () => import('./HeavyComponent'),
  {
    fallback: h('div', null, 'Loading...')
  }
);
```

### `Suspense`

Shows fallback while a lazy component loads.

```typescript
Suspense({
  children: LazyComponent,
  fallback: h('div', null, 'Loading...')
})
```

---

## Error Handling

### `createErrorBoundary(fallback, onError?)`

Creates an error boundary component.

```typescript
import { createErrorBoundary, h } from 'veliom';

const ErrorFallback = createErrorBoundary(
  (error) => h('div', null, `Error: ${error.message}`),
  (error, info) => console.error(error, info)
);
```

### `setGlobalErrorHandler(handler)`

Sets a global error handler.

```typescript
import { setGlobalErrorHandler } from 'veliom';

setGlobalErrorHandler((error, info) => {
  // Report to error tracking service
});
```

### `reportError(error)`

Reports an error to the global handler.

```typescript
import { reportError } from 'veliom';

try {
  // Some code
} catch (e) {
  reportError(e);
}
```

---

## Performance

### `benchmark(name, fn, options?)`

Runs a performance benchmark.

```typescript
import { benchmark } from 'veliom';

const result = benchmark('My operation', () => {
  // Code to benchmark
}, { iterations: 1000 });

console.log(result.opsPerSecond);
```

### `compareBenchmarks(...results)`

Compares multiple benchmark results.

```typescript
import { benchmark, compareBenchmarks } from 'veliom';

const result1 = benchmark('Method A', () => { /* ... */ });
const result2 = benchmark('Method B', () => { /* ... */ });

compareBenchmarks(result1, result2);
```
