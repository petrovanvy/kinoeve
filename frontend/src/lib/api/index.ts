import type { MoviesApi } from '../types';
import { createHttpApi } from './http';
type Config = { dataSource: 'mock' | 'http'; apiBaseUrl: string };
export let activeConfig: Config;
let instance: Promise<MoviesApi> | undefined;
export function getApi(): Promise<MoviesApi> {
  return instance ??= (async () => {
    let runtime: Partial<Config> = {};
    const response = await fetch('/config.json');
    if (response.ok) runtime = await response.json();
    activeConfig = { dataSource: runtime.dataSource || (import.meta.env.VITE_DATA_SOURCE === 'http' ? 'http' : 'mock'), apiBaseUrl: runtime.apiBaseUrl || import.meta.env.VITE_API_BASE_URL || '/api' };
    if (activeConfig.dataSource === 'http') return createHttpApi(activeConfig.apiBaseUrl);
    return (await import('./mock')).mockApi;
  })().catch(error => { instance = undefined; throw error; });
}
