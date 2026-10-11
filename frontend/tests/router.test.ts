import { beforeAll, afterAll, expect, it, vi } from 'vitest';
let parseRoute: typeof import('../src/lib/router').parseRoute;
beforeAll(async () => {
  vi.stubGlobal('window', { location: { href: 'http://localhost/' }, addEventListener: vi.fn() });
  parseRoute = (await import('../src/lib/router')).parseRoute;
});
afterAll(() => vi.unstubAllGlobals());
it('routes catalog including persisted selection parameters', () => {
  const route = parseRoute(new URL('http://localhost/?topic=detective&count=9'));
  expect(route.page).toBe('catalog'); expect(route.search.get('count')).toBe('9');
});
it('routes archive and prototype movie IDs on direct URLs', () => {
  expect(parseRoute(new URL('http://localhost/movies/6553389'))).toMatchObject({ page: 'movie', id: '6553389' });
  expect(parseRoute(new URL('http://localhost/movies/proto-knives/'))).toMatchObject({ page: 'movie', id: 'proto-knives' });
});
it('rejects unknown and nested paths', () => {
  expect(parseRoute(new URL('http://localhost/missing')).page).toBe('not-found');
  expect(parseRoute(new URL('http://localhost/movies/1/extra')).page).toBe('not-found');
});
