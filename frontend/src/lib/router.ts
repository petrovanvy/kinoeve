import { writable } from 'svelte/store';
export type Route = { page: 'catalog'; search: URLSearchParams } | { page: 'movie'; id: string; search: URLSearchParams } | { page: 'not-found'; search: URLSearchParams };
export function parseRoute(url: URL): Route {
  const path = url.pathname.replace(/\/$/, '') || '/';
  if (path === '/') return { page: 'catalog', search: url.searchParams };
  const match = /^\/movies\/([a-zA-Z0-9_-]+)$/.exec(path);
  return match ? { page: 'movie', id: match[1], search: url.searchParams } : { page: 'not-found', search: url.searchParams };
}
export const route = writable(parseRoute(new URL(window.location.href)));
window.addEventListener('popstate', () => route.set(parseRoute(new URL(window.location.href))));
export function navigate(href: string, replace = false, scroll = true) {
  const url = new URL(href, window.location.origin);
  if (url.origin !== window.location.origin) return;
  window.history[replace ? 'replaceState' : 'pushState']({}, '', url);
  route.set(parseRoute(url));
  if (scroll) window.scrollTo({ top: 0, behavior: 'instant' });
}
export function follow(event: MouseEvent) {
  const target = (event.target as Element).closest('a');
  if (!target || event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || target.target || target.hasAttribute('download')) return;
  const url = new URL(target.href);
  if (url.origin !== window.location.origin || url.hash) return;
  event.preventDefault();
  navigate(url.pathname + url.search);
}
