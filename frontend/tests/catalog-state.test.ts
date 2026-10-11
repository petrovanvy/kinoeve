import { describe, expect, it } from 'vitest';
import { catalogUrl, readCatalogState, refineCatalog, nextRefinements, refinementActions, readRefinementUsage, refinementUsage, recordRefinementClick, recommendationQuery, recommendationKey, cacheRecommendations, recommendationCache } from '../src/lib/catalogState';
import type { RefinementUsage } from '../src/lib/catalogState';
import { get } from 'svelte/store';
import { movies } from '../src/lib/api/data';
import { recommend } from '../src/lib/api/recommend';

describe('catalog journey state', () => {
  const initial = readCatalogState(new URLSearchParams('topic=detective'));
  it('restores the expanded selection and consumed actions from a shareable URL', () => {
    const revised = { ...refineCatalog(initial, 'humor'), count: 9 as const, primary: 'mood' as const, mood: 'childhood' };
    expect(readCatalogState(new URLSearchParams(catalogUrl(revised).split('?')[1]))).toEqual(revised);
  });
  it('replaces the last intention, resets expansion and allows previous choices again', () => {
    const funny = refineCatalog({ ...initial, count: 9 }, 'humor');
    expect(funny.count).toBe(3);
    expect(nextRefinements(funny).map(x => x.id)).not.toContain('humor');
    expect(nextRefinements(funny).map(x => x.id)).not.toEqual(nextRefinements(initial).map(x => x.id));
    const animated = refineCatalog(funny, 'animation');
    expect(animated.refinement).toBe('animation');
    expect(animated.consumed).toEqual(['humor', 'animation']);
    const funnyAgain = refineCatalog(animated, 'humor');
    expect(funnyAgain.refinement).toBe('humor');
    expect(funnyAgain.consumed).toEqual(['humor', 'animation']);
    expect(refineCatalog(funnyAgain, 'humor')).toBe(funnyAgain);
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
describe('refinement rotation', () => {
  it('keeps five unique choices throughout a long session, including an old exhausted URL', () => {
    let state = readCatalogState(new URLSearchParams('used=' + refinementActions.map(action => action.id).join(',')));
    const usage: RefinementUsage = {};
    for (let click = 0; click < 100; click++) {
      const actions = nextRefinements(state, usage);
      expect(actions).toHaveLength(5);
      expect(new Set(actions.map(action => action.id)).size).toBe(5);
      expect(actions.map(action => action.id)).not.toContain(state.refinement);
      const chosen = actions[0].id;
      usage[chosen] = (usage[chosen] || 0) + 1;
      state = refineCatalog(state, chosen);
    }
    expect(refinementActions.every(action => (usage[action.id] || 0) > 0)).toBe(true);
    const counts = Object.values(usage);
    expect(Math.max(...counts) - Math.min(...counts)).toBeLessThanOrEqual(1);
  });
  it('offers the least clicked choices first, with stable ties and without the active choice', () => {
    const state = readCatalogState(new URLSearchParams('refinement=cozy'));
    const usage: RefinementUsage = { humor: 9, animation: 4, energy: 1, cozy: 0, tension: 2, thoughtful: 1, childhood: 3 };
    expect(nextRefinements(state, usage).map(action => action.id)).toEqual(['energy', 'thoughtful', 'tension', 'childhood', 'animation']);
  });
  it('counts clicks across directions but does not count navigation or URL restoration', () => {
    refinementUsage.set({});
    recordRefinementClick('humor');
    recordRefinementClick('humor');
    recordRefinementClick('animation');
    recordRefinementClick('unknown');
    const state = readCatalogState(new URLSearchParams('topic=detective&refinement=humor'));
    nextRefinements(state, get(refinementUsage));
    catalogUrl(state);
    expect(get(refinementUsage)).toEqual({ humor: 2, animation: 1 });
    refinementUsage.set({});
  });
  it('ignores invalid saved counts while preserving valid history', () => {
    expect(readRefinementUsage({ humor: 3, animation: -2, energy: 1.5, cozy: '4', tension: null, thoughtful: Infinity, childhood: 0, unknown: 10 })).toEqual({ humor: 3, childhood: 0 });
    expect(readRefinementUsage(null)).toEqual({});
    expect(readRefinementUsage([1, 2])).toEqual({});
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
