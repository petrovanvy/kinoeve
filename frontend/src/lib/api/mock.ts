import { movies, topics, moods } from './data';
import { recommend } from './recommend';
import { ApiError } from './http';
import type { MoviesApi } from '../types';
function check(signal?: AbortSignal) { signal?.throwIfAborted(); }
export const mockApi: MoviesApi = {
  async getCollections(signal) { check(signal); return { topics, moods }; },
  async getRecommendations(query, signal) { check(signal); return recommend(movies, query); },
  async getMovie(id, signal) { check(signal); const movie = movies.find(m => m.id === id); if (!movie) throw new ApiError('Фильм не найден', 404); return movie; },
  async getMovies(ids, signal) { check(signal); return ids.flatMap(id => { const movie = movies.find(m => m.id === id); return movie ? [movie] : []; }); },
};
