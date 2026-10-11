import { describe, expect, it } from 'vitest';
import { catalogUrl, readCatalogState, refineCatalog, nextRefinements, recommendationQuery, recommendationKey, cacheRecommendations, recommendationCache } from '../src/lib/catalogState';
import { movies } from '../src/lib/api/data';
import { recommend } from '../src/lib/api/recommend';

describe('catalog journey state', () => {
  const initial = readCatalogState(new URLSearchParams('topic=detective'));
  it('restores the expanded selection and consumed actions from a shareable URL', () => {
    const revised = { ...refineCatalog(initial, 'humor'), count: 9 as const, primary: 'mood' as const, mood: 'childhood' };
    expect(readCatalogState(new URLSearchParams(catalogUrl(revised).split('?')[1]))).toEqual(revised);
  });
  it('replaces the last intention, resets expansion and removes consumed actions', () => {
    const funny = refineCatalog({ ...initial, count: 9 }, 'humor');
    expect(funny.count).toBe(3);
    expect(nextRefinements(funny).map(x => x.id)).not.toContain('humor');
    expect(nextRefinements(funny).map(x => x.id)).not.toEqual(nextRefinements(initial).map(x => x.id));
    const animated = refineCatalog(funny, 'animation');
    expect(animated.refinement).toBe('animation');
    expect(animated.consumed).toEqual(['humor', 'animation']);
    expect(refineCatalog(animated, 'humor')).toBe(animated);
  });
  it('uses one result cache for 3, 6 and 9 cards and restored navigation', () => {
    const key = recommendationKey(recommendationQuery(initial));
    expect(recommendationKey(recommendationQuery({ ...initial, count: 9 }))).toBe(key);
    const result = recommend(movies, recommendationQuery(initial));
    cacheRecommendations(key, result);
    const restored = readCatalogState(new URLSearchParams(catalogUrl(initial).split('?')[1]));
    expect(recommendationCache.get(recommendationKey(recommendationQuery(restored)))).toBe(result);
  });
  it('limits and validates URL state', () => {
    const state = readCatalogState(new URLSearchParams('count=999&primary=mood&used=humor,unknown,humor&q=' + 'x'.repeat(400)));
    expect(state.count).toBe(3); expect(state.primary).toBe('topic');
    expect(state.consumed).toEqual(['humor']); expect(state.query).toHaveLength(200);
  });
});
describe('new recommendation directions', () => {
  it('more movement changes the initial trio', () => {
    const before = recommend(movies, { topic: 'super' }).movies.slice(0, 3).map(movie => movie.id);
    const after = recommend(movies, { topic: 'super', refinement: 'energy' }).movies.slice(0, 3).map(movie => movie.id);
    expect(after).not.toEqual(before);
  });
  it('animation regenerates the selection without changing the topic', () => {
    const result = recommend(movies, { topic: 'super', refinement: 'animation' });
    expect(result.movies.slice(0, 3).every(movie => movie.topics.includes('animation') || movie.genres.some(g => /мульт|анимац/i.test(g)))).toBe(true);
  });
  it('a primary mood selects across genres instead of silently keeping superheroes', () => {
    const result = recommend(movies, { topic: 'super', mood: 'childhood', primary: 'mood' });
    expect(result.movies.slice(0, 3).every(movie => movie.moods.includes('childhood'))).toBe(true);
    const differentTopic = recommend(movies, { topic: 'detective', mood: 'childhood', primary: 'mood' });
    expect(differentTopic.movies.map(movie => movie.id)).toEqual(result.movies.map(movie => movie.id));
  });
});
