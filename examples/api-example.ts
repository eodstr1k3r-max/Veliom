import {
  createComponent,
  createSignal,
  createStore,
  mount,
  h,
  Show,
  For,
  onMount,
  onUnmount,
} from '../src/veliom';

interface User {
  id: number;
  name: string;
  email: string;
  company: {
    name: string;
  };
}

interface ApiState {
  data: User[] | null;
  loading: boolean;
  error: string | null;
}

const UserList = createComponent(() => {
  const state = createStore<ApiState>({
    data: null,
    loading: false,
    error: null,
  });

  const fetchUsers = async () => {
    state.set('loading', true);
    state.set('error', null);

    try {
      const response = await fetch('https://jsonplaceholder.typicode.com/users');
      if (!response.ok) throw new Error(`HTTP error: ${response.status}`);
      const data = await response.json() as User[];
      state.set('data', data);
    } catch (err) {
      state.set('error', err instanceof Error ? err.message : 'Unknown error');
    } finally {
      state.set('loading', false);
    }
  };

  const refetch = () => {
    fetchUsers();
  };

  return () =>
    h('div', { className: 'user-list' },
      h('div', { className: 'header' },
        h('h2', null, 'Users from API'),
        h('button', { onClick: refetch, disabled: state.get('loading') },
          state.get('loading') ? 'Loading...' : 'Refetch'
        )
      ),

      Show({
        when: !state.get('loading') && !state.get('error'),
        children: () =>
          Show({
            when: state.get('data') !== null,
            children: () =>
              For({
                each: state.get('data') || [],
                children: (user: User) =>
                  h('div', { key: String(user.id), className: 'user-card' },
                    h('div', { className: 'avatar' }, user.name.charAt(0).toUpperCase()),
                    h('div', { className: 'info' },
                      h('h3', null, user.name),
                      h('p', { className: 'email' }, user.email),
                      h('span', { className: 'company' }, user.company.name)
                    )
                  )
              }),
            fallback: h('p', null, 'No data')
          }),
        fallback:
          Show({
            when: state.get('loading'),
            children: () => h('div', { className: 'loading' }, 
              h('div', { className: 'spinner' }),
              h('p', null, 'Fetching users...')
            ),
            fallback: () =>
              h('div', { className: 'error' },
                h('p', null, `Error: ${state.get('error')}`),
                h('button', { onClick: refetch }, 'Retry')
              )
          }) as any
      })
    );
});

const SearchExample = createComponent(() => {
  const query = createSignal('');
  const results = createSignal<User[]>([]);
  const searching = createSignal(false);

  let debounceTimer: ReturnType<typeof setTimeout> | null = null;

  const search = async (searchQuery: string) => {
    if (!searchQuery.trim()) {
      results.set([]);
      return;
    }

    searching.set(true);
    try {
      const response = await fetch(
        `https://jsonplaceholder.typicode.com/users?q=${encodeURIComponent(searchQuery)}`
      );
      const data = await response.json() as User[];
      results.set(data);
    } finally {
      searching.set(false);
    }
  };

  onMount(() => {
    search('');
  });

  onUnmount(() => {
    if (debounceTimer) clearTimeout(debounceTimer);
  });

  return () =>
    h('div', { className: 'search-example' },
      h('h2', null, 'Search with Debounce'),
      h('input', {
        type: 'text',
        placeholder: 'Search users...',
        value: query.get(),
        onInput: (e: Event) => {
          const value = (e.target as HTMLInputElement).value;
          query.set(value);

          if (debounceTimer) clearTimeout(debounceTimer);
          debounceTimer = setTimeout(() => search(value), 300);
        }
      }),
      Show({
        when: !searching.get(),
        children: () =>
          h('p', { className: 'count' }, `${results.get().length} results found`),
        fallback: h('p', null, 'Searching...')
      }),
      For({
        each: results.get(),
        children: (user: User) =>
          h('div', { key: String(user.id), className: 'result-item' },
            h('strong', null, user.name),
            h('span', null, ` - ${user.email}`)
          )
      })
    );
});

const App = createComponent(() => {
  const selectedTab = createSignal<'list' | 'search'>('list');

  return () =>
    h('div', { className: 'api-demo' },
      h('h1', null, 'API-Agnostic Example'),
      h('p', { className: 'description' },
        'Using native fetch() inside components - no framework wrappers needed'
      ),

      h('div', { className: 'tabs' },
        h('button', {
          className: selectedTab.get() === 'list' ? 'active' : '',
          onClick: () => selectedTab.set('list')
        }, 'User List'),
        h('button', {
          className: selectedTab.get() === 'search' ? 'active' : '',
          onClick: () => selectedTab.set('search')
        }, 'Search')
      ),

      Show({
        when: selectedTab.get() === 'list',
        children: () => UserList(),
        fallback: SearchExample
      })
    );
});

const container = document.getElementById('app');
if (container) {
  mount(App, container);
}
