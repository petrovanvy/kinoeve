import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { movies, topics, moods } from '../src/lib/api/data';
import { recommend } from '../src/lib/api/recommend';
import { mockApi } from '../src/lib/api/mock';
describe('assignment and prototype integration', () => {
  it('preserves all 10 assignment movies and 19 additions with unique IDs', () => {
    expect(movies.filter(m => m.origin === 'assignment')).toHaveLength(10);
    expect(movies).toHaveLength(29);
    expect(new Set(movies.map(m => m.id)).size).toBe(movies.length);
  });
  it('references existing posters, portraits and stills', () => {
    for (const movie of movies) for (const image of [movie.poster, ...movie.media.map(m => m.image), ...movie.people.flatMap(p => p.photo ? [p.photo] : [])]) expect(existsSync('public' + image), image).toBe(true);
    for (const collection of [...topics, ...moods]) expect(collection.posters.length).toBeGreaterThan(0);
  });
  it('serves sourced reviews, a trailer, stills and creators for every film', async () => {
    for (const item of movies) {
      const movie = await mockApi.getMovie(item.id);
      expect(movie.reviews?.praise.length, movie.title).toBeGreaterThanOrEqual(2);
      expect(movie.reviews?.caveats.length, movie.title).toBeGreaterThan(0);
      expect(movie.reviews?.sources.length, movie.title).toBeGreaterThan(0);
      expect(movie.media.some(m => m.type === 'trailer' && m.url), movie.title).toBe(true);
      expect(movie.media.some(m => m.type === 'image'), movie.title).toBe(true);
      expect(movie.people.some(p => p.role === 'Режиссёр'), movie.title).toBe(true);
      expect(movie.people.some(p => p.photo), movie.title).toBe(true);
      expect(Array.isArray(movie.awards)).toBe(true);
      for (const source of [...(movie.reviews?.sources ?? []), ...(movie.detailSources ?? [])]) expect(['http:', 'https:']).toContain(new URL(source.url).protocol);
      for (const media of movie.media) for (const url of [media.url, media.embedUrl, media.videoUrl].filter(Boolean)) expect(new URL(url!).protocol).toBe('https:');
    }
  });
});
describe('recommendation behavior', () => {
  it('returns 9 distinct candidates, with superhero matches first', () => {
    const result = recommend(movies, { topic: 'super' });
    expect(result.movies).toHaveLength(9);
    expect(new Set(result.movies.map(m => m.id)).size).toBe(9);
    expect(result.movies.slice(0, 3).every(m => m.topics.includes('super'))).toBe(true);
  });
  it('changes the first three after more humor', () => {
    const initial = recommend(movies, { topic: 'super' }).movies.slice(0, 3).map(m => m.id);
    const funny = recommend(movies, { topic: 'super', refinement: 'humor' }).movies.slice(0, 3);
    expect(funny.map(m => m.id)).not.toEqual(initial);
    expect(funny.every(m => m.topics.includes('comedy') || m.moods.includes('light'))).toBe(true);
  });
  it('finds assignment films by name', () => {
    expect(recommend(movies, { topic: 'authors', query: 'Песнь моря' }).movies[0].title).toBe('Песнь моря');
  });
  it('finds multiple films using a review characteristic', () => {
    const tag = movies.find(m => m.id === 'proto-iron')!.reviews!.praise.find(t => t.query === 'яркие актёры')!;
    const result = recommend(movies, { topic: 'super', query: tag.query });
    expect(result.relaxed).toBe(false);
    expect(result.movies.slice(0, 3).every(m => m.reviews?.praise.some(t => t.query === tag.query))).toBe(true);
  });
  it('relaxes impossible conditions and reports it instead of empty results', () => {
    const result = recommend(movies, { topic: 'missing', query: 'несуществующийзапрос' });
    expect(result.relaxed).toBe(true); expect(result.movies).toHaveLength(9); expect(result.message).toBeTruthy();
  });
  it('does not mutate the dataset during refinement', () => {
    const before = JSON.stringify(movies); recommend(movies, { topic: 'detective', refinement: 'energy' }); expect(JSON.stringify(movies)).toBe(before);
  });
  it('returns 404 for unknown films and respects request cancellation', async () => {
    await expect(mockApi.getMovie('missing')).rejects.toMatchObject({ status: 404 });
    const controller = new AbortController(); controller.abort(); await expect(mockApi.getMovie('proto-knives', controller.signal)).rejects.toThrow();
  });
});
