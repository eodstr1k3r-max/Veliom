import { createComponent, createSignal, createRef, mount, h, Fragment, Show, For, mergeRefs } from '../src/veliom';

const App = createComponent(() => {
  const count = createSignal(0);
  const showCounter = createSignal(true);
  const inputRef = createRef<HTMLInputElement>();
  const items = createSignal<string[]>(['Veliom', 'Performance', 'Simplicity']);
  const inputValue = createSignal('');

  return () =>
    h('div', { className: 'app' },
      h('h1', null, 'Veliom Demo'),
      h('p', null, 'Ultra-fast frontend framework'),

      Show({
        when: showCounter.get(),
        children: () =>
          h('div', { className: 'counter-section' },
            h('div', { className: 'counter' }, String(count.get())),
            h('div', { className: 'buttons' },
              h('button', { onClick: () => count.update(n => n - 1) }, '-'),
              h('button', { onClick: () => count.update(n => n + 1) }, '+')
            )
          )
      }),

      h('button', {
        onClick: () => showCounter.update(v => !v),
        className: 'toggle-btn'
      }, showCounter.get() ? 'Hide Counter' : 'Show Counter'),

      h('div', { className: 'input-section' },
        h('input', {
          type: 'text',
          value: inputValue.get(),
          placeholder: 'Type something...',
          ref: mergeRefs(inputRef),
          onInput: (e: Event) => {
            const target = e.target as HTMLInputElement;
            inputValue.set(target.value);
          }
        }),
        h('p', { className: 'input-display' }, `Typed: ${inputValue.get()}`)
      ),

      h('div', { className: 'list-section' },
        h('h2', null, 'Features'),
        h('button', {
          onClick: () => {
            const newItem = inputValue.get() || `Item ${items.get().length + 1}`;
            items.update(list => [...list, newItem]);
            inputValue.set('');
          }
        }, 'Add Item'),
        For({
          each: items.get(),
          children: (item, index) =>
            h('div', { key: item, className: 'list-item' },
              h('span', null, `${index}: ${item}`),
              h('button', {
                onClick: () => items.update(list => list.filter(i => i !== item)),
                className: 'delete-btn'
              }, 'x')
            )
        })
      ),

      Fragment({
        children: [
          h('hr', null),
          h('footer', null, `Total items: ${items.get().length}`)
        ]
      })
    );
});

const container = document.getElementById('app');
if (container) {
  mount(App, container);
}
