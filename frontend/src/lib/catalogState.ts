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
] as const;
type RefinementId = typeof refinementActions[number]['id'];
export type RefinementUsage = Partial<Record<RefinementId, number>>;
const usageKey = 'kinoeve.refinement-usage.v1';
export function readRefinementUsage(value: unknown): RefinementUsage {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const usage: RefinementUsage = {};
  for (const { id } of refinementActions) {
    const count = (value as Record<string, unknown>)[id];
    if (typeof count === 'number' && Number.isSafeInteger(count) && count >= 0) usage[id] = count;
  }
  return usage;
}
function restoreUsage(): RefinementUsage {
  try { return readRefinementUsage(JSON.parse(localStorage.getItem(usageKey) || '{}')); }
  catch { return {}; }
}
export const refinementUsage = writable<RefinementUsage>(restoreUsage());
refinementUsage.subscribe(usage => {
  try { localStorage.setItem(usageKey, JSON.stringify(usage)); }
  catch { /* Counts remain in memory if browser storage is unavailable. */ }
});
export function recordRefinementClick(id: string) {
  const action = refinementActions.find(action => action.id === id);
  if (action) refinementUsage.update(usage => ({ ...usage, [action.id]: Math.min((usage[action.id] || 0) + 1, Number.MAX_SAFE_INTEGER) }));
}
export interface CatalogState {
  topic: string; mood: string; primary: 'topic' | 'mood';
  refinement: string; consumed: string[]; query: string; count: 3 | 6 | 9;
}
const initial: CatalogState = { topic: 'super', mood: '', primary: 'topic', refinement: '', consumed: [], query: '', count: 3 };
const knownActions = new Set<string>(refinementActions.map(action => action.id));
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
  if (!knownActions.has(id) || state.refinement === id) return state;
  return { ...state, refinement: id, consumed: [...new Set([...state.consumed, id])], query: '', count: 3 };
}
export function nextRefinements(state: CatalogState, usage: RefinementUsage = {}) {
  // Only hide the current intention. Previous choices can return, so suggestions never run out.
  // Stable ties preserve the editorial order instead of shuffling on every render.
  return refinementActions.filter(action => action.id !== state.refinement)
    .sort((a, b) => (usage[a.id] || 0) - (usage[b.id] || 0)).slice(0, 5);
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
