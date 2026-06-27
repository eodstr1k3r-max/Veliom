import { createSignal, Signal } from '../state/store';
import { VNode, h } from './renderer';

export interface RouteDefinition {
  path: string;
  component: () => VNode;
}

export interface RouterOptions {
  mode?: 'hash' | 'history';
  base?: string;
}

export interface Router {
  currentPath: Signal<string>;
  params: Signal<Record<string, string>>;
  navigate: (path: string) => void;
  resolve: (path: string) => string;
  dispose: () => void;
}

function matchRoute(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.replace(/\/$/, '').split('/');
  const pathParts = path.replace(/\/$/, '').split('/');
  if (patternParts.length !== pathParts.length) return null;
  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i++) {
    if (patternParts[i].startsWith(':')) {
      params[patternParts[i].slice(1)] = decodeURIComponent(pathParts[i]);
    } else if (patternParts[i] !== pathParts[i]) {
      return null;
    }
  }
  return params;
}

function escapeRegex(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const DANGEROUS_PATH_PATTERNS = /(?:javascript|data|vbscript):|<|>/i;

function isSafePath(path: string): boolean {
  return !DANGEROUS_PATH_PATTERNS.test(path) && path.length < 2048;
}

export function createRouter(routes: RouteDefinition[], options: RouterOptions = {}): Router {
  const mode = options.mode || 'hash';
  const base = options.base || '/';

  const getPath = (): string => {
    if (typeof window === 'undefined') return '/';
    if (mode === 'hash') {
      return window.location.hash.slice(1) || '/';
    }
    return window.location.pathname.replace(new RegExp('^' + escapeRegex(base.replace(/\/$/, ''))), '') || '/';
  };

  const currentPath = createSignal(getPath());
  const currentParams = createSignal<Record<string, string>>({});

  const updatePath = () => {
    const path = getPath();
    currentPath.set(path);
    for (const route of routes) {
      const params = matchRoute(route.path, path);
      if (params) {
        currentParams.set(params);
        return;
      }
    }
    currentParams.set({});
  };

  const handlePop = () => updatePath();

  if (typeof window !== 'undefined') {
    window.addEventListener('popstate', handlePop);
    if (mode === 'hash') {
      window.addEventListener('hashchange', handlePop);
    }
  }

  updatePath();

  return {
    currentPath,
    params: currentParams,
    navigate(path: string) {
      if (!isSafePath(path)) {
        console.warn('Veliom: Blocked unsafe navigation path');
        return;
      }
      const resolved = mode === 'hash' ? '#' + path : base.replace(/\/$/, '') + path;
      if (mode === 'hash') {
        window.location.hash = path;
        updatePath();
      } else {
        window.history.pushState(null, '', resolved);
        updatePath();
      }
    },
    resolve(path: string) {
      return mode === 'hash' ? '#' + path : base.replace(/\/$/, '') + path;
    },
    dispose() {
      window.removeEventListener('popstate', handlePop);
      window.removeEventListener('hashchange', handlePop);
    },
  };
}

export function Route(props: {
  path: string;
  component: () => VNode;
  router: Router;
  fallback?: VNode;
}): VNode {
  const params = matchRoute(props.path, props.router.currentPath.get());
  if (!params) return props.fallback || { type: 'empty', props: {} };
  return props.component();
}

export function Link(props: {
  to: string;
  router: Router;
  children?: VNode | VNode[];
  class?: string;
  [key: string]: unknown;
}): VNode {
  const { to, router, children, ...attrs } = props;
  const href = router.resolve(to);
  const clickHandler = (e: Event) => {
    e.preventDefault();
    router.navigate(to);
  };
  const childArr = children ? (Array.isArray(children) ? children : [children]) : [];
  return h('a', { ...attrs, href, onClick: clickHandler }, ...childArr);
}

export function useRouter(router: Router): {
  path: () => string;
  params: () => Record<string, string>;
  navigate: (path: string) => void;
} {
  return {
    path: () => router.currentPath.get(),
    params: () => router.params.get(),
    navigate: (path: string) => router.navigate(path),
  };
}
