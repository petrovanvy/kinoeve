import { afterEach, describe, expect, it, vi } from 'vitest';
import { createHttpApi } from '../src/lib/api/http';
afterEach(() => vi.unstubAllGlobals());
describe('backend transport', () => {
  it('encodes requests including Russian queries', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(JSON.stringify({ movies: [], relaxed: false }), { headers: { 'Content-Type': 'application/json' } })); vi.stubGlobal('fetch', fetch);
    await createHttpApi('/api/').getRecommendations({ topic: 'detective', query: 'юмор & тайна' });
    const url = new URL(fetch.mock.calls[0][0], 'http://localhost');
    expect(url.pathname).toBe('/api/recommendations'); expect(url.searchParams.get('query')).toBe('юмор & тайна');
  });
  it('preserves 404 status for film not found', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('', { status: 404 })));
    await expect(createHttpApi('/api').getMovie('unknown')).rejects.toMatchObject({ status: 404 });
  });
  it('rejects SPA HTML masquerading as API response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('<html/>', { headers: { 'Content-Type': 'text/html' } })));
    await expect(createHttpApi('/api').getMovie('1')).rejects.toThrow('неожиданный ответ');
  });
});
