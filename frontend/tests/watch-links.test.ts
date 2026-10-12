import { describe, expect, it } from 'vitest';
import { movies } from '../src/lib/api/data';
import links from '../src/data/watch-links.json';
import research from '../src/data/watch-sources.json';

describe('watching providers', () => {
  it('covers every film and all three providers, including unavailable films', () => {
    expect(Object.keys(links).sort()).toEqual(movies.map(m => m.id).sort());
    for (const movie of movies) {
      const record = research.movies[movie.id as keyof typeof research.movies];
      expect(record.title).toBe(movie.title);
      expect(record.providers.map(p => p.label)).toEqual(['Ivi', 'Okko', 'Кинопоиск']);
    }
  });
  it('publishes direct provider URLs with evidence and separates regional uncertainty', () => {
    const domains: Record<string, string> = { Ivi: 'www.ivi.ru', Okko: 'okko.tv', Кинопоиск: 'hd.kinopoisk.ru' };
    for (const movie of movies) {
      expect(new Set(movie.links.map(l => l.label)).size).toBe(movie.links.length);
      for (const link of movie.links) {
        const url = new URL(link.url);
        expect(url.protocol).toBe('https:');
        expect(url.hostname).toBe(domains[link.label]);
        expect(url.search).toBe('');
        const evidence = research.movies[movie.id as keyof typeof research.movies].providers.find(p => p.label === link.label)!;
        expect(evidence.status).toBe(link.availability);
        expect(evidence.evidence.length).toBeGreaterThan(15);
        if (link.availability === 'region_check') expect(link.access).toContain('Проверить');
      }
    }
  });
  it('does not retain placeholder IMDb links or offer films awaiting their release', () => {
    expect(movies.find(m => m.id === 'proto-iron')!.links).toEqual([]);
    expect(movies.find(m => m.id === 'proto-knives')!.links.map(l => l.label)).toEqual(['Ivi', 'Okko', 'Кинопоиск']);
    expect(movies.flatMap(m => m.links).some(l => l.url.includes('imdb.com'))).toBe(false);
  });
});
