import { derived, writable } from 'svelte/store';
import type { Collection, RecommendationQuery, RecommendationResult } from './types';

export const refinementActions = [
  { id: 'humor', label: 'Больше юмора' },
  { id: 'animation', label: 'Более мультяшное' },
  { id: 'energy', label: 'Больше движения' },
  { id: 'cozy', label: 'Больше тепла' },
  { id: 'tension', label: 'Больше интриги' },
  { id: 'thoughtful', label: 'Есть о чём подумать' },
  { id: 'childhood', label: 'Что-нибудь знакомое' },
];
export interface CatalogState {
  topic: string; mood: string; primary: 'topic' | 'mood';
  refinement: string; consumed: string[]; query: string; count: 3 | 6 | 9;
}
const initial: CatalogState = { topic: 'super', mood: '', primary: 'topic', refinement: '', consumed: [], query: '', count: 3 };
const knownActions = new Set(refinementActions.map(action => action.id));
export function readCatalogState(search: URLSearchParams): CatalogState {
  const refinement = search.get('refinement') || '';
  const consumed = [...new Set((search.get('used') || refinement).split(',').filter(id => knownActions.has(id)))];
  const mood = search.get('mood') || '';
  return { topic: search.get('topic') || 'super', mood,
    primary: search.get('primary') === 'mood' && mood ? 'mood' : 'topic',
    refinement, consumed, query: (search.get('q') || '').slice(0, 200),
    count: search.get('count') === '9' ? 9 : search.get('count') === '6' ? 6 : 3 };
}
export function catalogUrl(state: CatalogState): string {
  const params = new URLSearchParams({ topic: state.topic });
  if (state.mood) params.set('mood', state.mood);
  if (state.primary === 'mood') params.set('primary', state.primary);
  if (state.refinement) params.set('refinement', state.refinement);
  if (state.consumed.length) params.set('used', state.consumed.join(','));
  if (state.query) params.set('q', state.query);
  if (state.count > 3) params.set('count', String(state.count));
  return '/?' + params;
}
export function refineCatalog(state: CatalogState, id: string): CatalogState {
  if (!knownActions.has(id) || state.consumed.includes(id)) return state;
  return { ...state, refinement: id, consumed: [...state.consumed, id], query: '', count: 3 };
}
export function nextRefinements(state: CatalogState) {
  const remaining = refinementActions.filter(action => !state.consumed.includes(action.id));
  // Advance the suggestions on each revision, rather than showing the same unused pair forever.
  const offset = remaining.length ? state.consumed.length % remaining.length : 0;
  return [...remaining.slice(offset), ...remaining.slice(0, offset)].slice(0, 3);
}
function restore(): CatalogState {
  try {
    if (typeof window !== 'undefined' && window.location?.href) {
      const current = new URL(window.location.href);
      if (current.pathname === '/' && current.searchParams.size && !current.searchParams.has('saved')) return readCatalogState(current.searchParams);
    }
    const url = sessionStorage.getItem('kinoeve.catalog.v1');
    return url ? readCatalogState(new URLSearchParams(url.split('?')[1])) : { ...initial };
  }
  catch { return { ...initial }; }
}
export const catalogState = writable<CatalogState>(restore());
export const todayHref = derived(catalogState, catalogUrl);
catalogState.subscribe(state => { try { sessionStorage.setItem('kinoeve.catalog.v1', catalogUrl(state)); } catch { /* In-memory state still works if browser storage is unavailable. */ } });
export function recommendationQuery(state: CatalogState): RecommendationQuery {
  return { topic: state.topic, mood: state.mood, primary: state.primary, refinement: state.refinement, query: state.query };
}
export function recommendationKey(query: RecommendationQuery) { return JSON.stringify(query); }
// Keep the current results when the catalog is unmounted, or only its expanded row count changes.
export const recommendationCache = new Map<string, RecommendationResult>();
export let collectionCache: { topics: Collection[]; moods: Collection[] } | undefined;
export function cacheCollections(value: { topics: Collection[]; moods: Collection[] }) { collectionCache = value; }
export function cacheRecommendations(key: string, value: RecommendationResult) {
  recommendationCache.delete(key);
  recommendationCache.set(key, value);
  if (recommendationCache.size > 20) recommendationCache.delete(recommendationCache.keys().next().value!);
}
