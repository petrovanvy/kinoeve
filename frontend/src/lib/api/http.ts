import type { MoviesApi, Movie, Collection, RecommendationResult } from '../types';
export class ApiError extends Error {
  constructor(message: string, public status = 0) { super(message); this.name = 'ApiError'; }
}
export function createHttpApi(baseUrl: string): MoviesApi {
  const base = baseUrl.replace(/\/$/, '');
  async function request<T>(path: string, signal?: AbortSignal): Promise<T> {
    const controller = new AbortController();
    const abort = () => controller.abort(signal?.reason);
    if (signal?.aborted) abort(); else signal?.addEventListener('abort', abort, { once: true });
    const timer = setTimeout(() => controller.abort(new Error('timeout')), 12000);
    try {
      const response = await fetch(base + path, { signal: controller.signal, headers: { Accept: 'application/json' } });
      if (!response.ok) throw new ApiError(response.status === 404 ? 'Фильм не найден' : 'Не удалось получить данные. Попробуй ещё раз.', response.status);
      if (!response.headers.get('content-type')?.includes('application/json')) throw new ApiError('Сервер вернул неожиданный ответ');
      return await response.json() as T;
    } catch (error) {
      if (signal?.aborted) throw error;
      if (error instanceof ApiError) throw error;
      throw new ApiError(controller.signal.aborted ? 'Сервер не ответил вовремя. Попробуй ещё раз.' : 'Не удалось связаться с сервером.');
    } finally { clearTimeout(timer); signal?.removeEventListener('abort', abort); }
  }
  return {
    getCollections: signal => request<{ topics: Collection[]; moods: Collection[] }>('/collections', signal),
    getRecommendations: (query, signal) => { const params = new URLSearchParams(); for (const [k, v] of Object.entries(query)) if (v) params.set(k, v); return request<RecommendationResult>('/recommendations?' + params, signal); },
    getMovie: (id, signal) => request<Movie>('/movies/' + encodeURIComponent(id), signal),
    getMovies: (ids, signal) => request<Movie[]>('/movies?ids=' + ids.map(encodeURIComponent).join(','), signal),
  };
}
