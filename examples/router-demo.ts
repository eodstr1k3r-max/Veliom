import {
  createComponent,
  createRouter,
  Route,
  Link,
  useRouter,
  mount,
  h,
} from '../src/veliom';

const router = createRouter(
  [
    { path: '/', component: () => h('div', null, 'home') },
    { path: '/about', component: () => h('div', null, 'about') },
    { path: '/users/:id', component: () => h('div', null, 'user') },
  ],
  { mode: 'hash' }
);

const Home = () =>
  h('div', { className: 'page' },
    h('h2', null, 'Home'),
    h('p', null, 'Welcome to the router demo. Use the links above to navigate.')
  );

const About = () =>
  h('div', { className: 'page' },
    h('h2', null, 'About'),
    h('p', null, 'Veliom ships a tiny hash/history router with params and links.')
  );

const UserPage = createComponent(() => {
  const { params } = useRouter(router);
  const id = params().id ?? '?';
  return h('div', { className: 'page' },
    h('h2', null, `User ${id}`),
    h('p', null, `Route params: ${JSON.stringify(params())}`)
  );
});

const NotFound = () =>
  h('div', { className: 'page' },
    h('h2', null, '404'),
    h('p', null, 'No route matched this path.')
  );

const App = createComponent(() => {
  const { path } = useRouter(router);

  return () =>
    h('div', { className: 'router-demo' },
      h('h1', null, 'Router Demo'),
      h('nav', { className: 'tabs' },
        Link({ to: '/', router, children: h('span', null, 'Home') }),
        Link({ to: '/about', router, children: h('span', null, 'About') }),
        Link({ to: '/users/42', router, children: h('span', null, 'User 42') })
      ),
      h('p', { className: 'current' }, `Current path: ${path()}`),
      Route({ path: '/', router, component: Home }),
      Route({ path: '/about', router, component: About }),
      Route({
        path: '/users/:id',
        router,
        component: () => UserPage.render({}),
        fallback: NotFound(),
      })
    );
});

const container = document.getElementById('app');
if (container) {
  mount(App, container);
}
