import { writable, get } from 'svelte/store';
type Preferences = { saved: string[]; watched: string[] };
const key = 'kinoeve.preferences.v1';
function read(): Preferences {
  try { const value = JSON.parse(localStorage.getItem(key) || '{}'); return { saved: valid(value.saved), watched: valid(value.watched) }; }
  catch { return { saved: [], watched: [] }; }
}
function valid(value: unknown): string[] { return Array.isArray(value) ? [...new Set(value.filter((x): x is string => typeof x === 'string'))] : []; }
export const preferences = writable<Preferences>(read());
export const storageUnavailable = writable(false);
export function togglePreference(kind: keyof Preferences, id: string) {
  const current = get(preferences);
  const next = { ...current, [kind]: current[kind].includes(id) ? current[kind].filter(x => x !== id) : [...current[kind], id] };
  preferences.set(next);
  try { localStorage.setItem(key, JSON.stringify(next)); } catch { storageUnavailable.set(true); }
}
window.addEventListener('storage', event => { if (event.key === key) preferences.set(read()); });
