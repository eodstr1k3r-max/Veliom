import {
  createComponent,
  createSignal,
  createRef,
  mount,
  h,
  Fragment,
  Show,
  For,
  mergeRefs,
  createPortal,
  createErrorBoundary,
  onMount,
  onUnmount,
  createStore,
} from '../src/veliom';

const store = createStore({ theme: 'dark', notifications: 3 });

const Modal = createComponent((props: { isOpen: boolean; onClose: () => void; title: string; children: any }) => {
  return () =>
    Show({
      when: props.isOpen,
      children: () =>
        createPortal({
          children: h('div', { className: 'modal-overlay' },
            h('div', { className: 'modal-content' },
              h('div', { className: 'modal-header' },
                h('h2', null, props.title),
                h('button', { className: 'close-btn', onClick: props.onClose }, 'x')
              ),
              h('div', { className: 'modal-body' }, props.children)
            )
          ),
          target: document.body
        }),
      fallback: { type: 'empty', props: {} }
    });
});

const NotificationBadge = createComponent(() => {
  const count = createSignal(0);
  
  onMount(() => {
    const interval = setInterval(() => {
      count.update(n => n + 1);
    }, 1000);
    return () => clearInterval(interval);
  });

  return () =>
    Show({
      when: count.get() > 0,
      children: () =>
        h('span', { className: 'badge' }, String(count.get())),
      fallback: null
    });
});

const ErrorDemo = createComponent(() => {
  const [hasError, setHasError] = createSignal(false);
  const error = createSignal<Error | null>(null);

  const triggerError = () => {
    try {
      throw new Error('This is a demo error!');
    } catch (e) {
      error.set(e as Error);
      setHasError(true);
    }
  };

  return () =>
    h('div', { className: 'error-demo' },
      h('h3', null, 'Error Boundary Demo'),
      Show({
        when: !hasError.get(),
        children: () =>
          h('button', { className: 'error-btn', onClick: triggerError }, 'Trigger Error'),
        fallback: () =>
          h('div', { className: 'error-message' },
            h('p', null, `Error: ${error.get()?.message}`),
            h('button', { onClick: () => setHasError(false) }, 'Reset')
          )
      })
    );
});

const App = createComponent(() => {
  const count = createSignal(0);
  const showModal = createSignal(false);
  const inputRef = createRef<HTMLInputElement>();
  const items = createSignal<string[]>(['Ultra Fast', 'Lightweight', 'Developer Friendly']);
  const inputValue = createSignal('');

  onMount(() => {
    console.log('App mounted');
    return () => console.log('App unmounted');
  });

  onUnmount(() => {
    console.log('Cleanup on unmount');
  });

  return () =>
    h('div', { className: 'app' },
      h('header', null,
        h('h1', null, 'Veliom Framework'),
        h('span', { className: 'version' }, 'v0.1.0')
      ),

      Modal({
        isOpen: showModal.get(),
        onClose: () => showModal.set(false),
        title: 'Welcome Modal',
        children: h('div', null,
          h('p', null, 'This is a portal-based modal rendered to document.body'),
          h('p', null, 'It overlays the main content!')
        )
      }),

      h('section', { className: 'counter-section' },
        h('h2', null, 'Reactive Counter'),
        h('div', { className: 'counter' }, String(count.get())),
        h('div', { className: 'buttons' },
          h('button', { onClick: () => count.update(n => n - 1) }, '-'),
          h('button', { onClick: () => count.update(n => n + 1) }, '+')
        )
      ),

      h('section', { className: 'input-section' },
        h('h2', null, 'Add Features'),
        h('div', { className: 'input-row' },
          h('input', {
            type: 'text',
            placeholder: 'Type a feature...',
            value: inputValue.get(),
            ref: mergeRefs(inputRef),
            onInput: (e: Event) => {
              const target = e.target as HTMLInputElement;
              inputValue.set(target.value);
            }
          }),
          h('button', {
            onClick: () => {
              const val = inputValue.get() || `Feature ${items.get().length + 1}`;
              items.update(list => [...list, val]);
              inputValue.set('');
              if (inputRef.current) inputRef.current.value = '';
            }
          }, 'Add')
        )
      ),

      h('section', { className: 'list-section' },
        h('h2', null, 'Features'),
        For({
          each: items.get(),
          children: (item, index) =>
            h('div', { key: item, className: 'list-item' },
              h('span', { className: 'index' }, `${index + 1}`),
              h('span', { className: 'text' }, item),
              h('button', {
                className: 'delete-btn',
                onClick: () => items.update(list => list.filter(i => i !== item))
              }, 'x')
            )
        })
      ),

      ErrorDemo(),

      h('section', { className: 'store-section' },
        h('h2', null, 'Global Store'),
        h('p', null, `Theme: ${store.get('theme')}`),
        h('p', null, `Notifications: ${store.get('notifications')}`),
        h('button', {
          onClick: () => store.update('notifications', n => n + 1)
        }, 'Increment Notifications'),
        NotificationBadge()
      ),

      h('section', { className: 'actions' },
        h('button', {
          className: 'primary',
          onClick: () => showModal.set(true)
        }, 'Open Modal'),
        h('button', {
          onClick: () => store.set('theme', store.get('theme') === 'dark' ? 'light' : 'dark')
        }, 'Toggle Theme')
      ),

      Fragment({
        children: [
          h('hr', null),
          h('footer', null, 
            `Total features: ${items.get().length} | Built with Veliom`
          )
        ]
      })
    );
});

const container = document.getElementById('app');
if (container) {
  mount(App, container);
}
