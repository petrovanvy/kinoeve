import type { Movie, RecommendationQuery, RecommendationResult } from '../types';
const normalize = (value: string) => value.toLowerCase().replaceAll('ё', 'е');
export function recommend(movies: Movie[], query: RecommendationQuery): RecommendationResult {
  const seed: Record<string, string[]> = {
    super: query.refinement === 'humor' ? ['thor', 'guardians', 'shazam', 'spider', 'iron', 'incredibles', 'hancock', 'bighero', 'strange'] : ['iron', 'spider', 'dark', 'incredibles', 'guardians', 'hancock', 'strange', 'bighero', 'batman'],
    detective: query.refinement === 'humor' ? ['nice', 'clue', 'knives', 'sherlock', 'enola', 'budapest', 'pulp', 'batman', 'inception'] : ['knives', 'sherlock', 'batman', 'dark', 'inception', 'pulp', 'nice', 'clue', 'enola'],
  };
  const desired = normalize(query.query || '');
  const terms = desired.split(/\s+/).filter(word => word.length > 2);
  const humor = ['humor', 'lighter'].includes(query.refinement || '');
  const energy = query.refinement === 'energy';
  const candidates = movies.map((movie, index) => {
    const text = normalize([movie.title, movie.originalTitle, movie.logline, movie.synopsis, movie.mood, ...movie.genres, ...movie.people.map(p => p.name)].join(' '));
    const matches = terms.filter(word => text.includes(word)).length;
    const topic = movie.topics.includes(query.topic);
    const mood = !!query.mood && movie.moods.includes(query.mood);
    const funny = movie.topics.includes('comedy') || movie.moods.includes('light');
    const dynamic = movie.moods.includes('energy') || movie.topics.includes('action');
    const seedIndex = (seed[query.topic] || []).indexOf(movie.id.replace('proto-', ''));
    const editorial = seedIndex >= 0 ? 30 - seedIndex * 2 : 0;
    const score = (topic ? 100 : 0) + editorial + (mood ? 40 : 0) + (humor && funny ? 80 : 0) + (energy && dynamic ? 80 : 0) + matches * 140 + (movie.kp ?? movie.imdb ?? 0) - index / 1000;
    return { movie, score, topic, matches, mood, funny, dynamic };
  }).sort((a, b) => b.score - a.score);
  const exact = candidates.filter(x => x.topic && (!query.mood || x.mood) && (!humor || x.funny) && (!energy || x.dynamic) && (!terms.length || x.matches > 0));
  const relaxed = exact.length < 3;
  // Preserve exact results, then progressively relax conditions instead of producing an empty page.
  const ordered = [...exact, ...candidates.filter(x => !exact.includes(x))].slice(0, 9);
  return { movies: ordered.map(x => x.movie), relaxed, message: relaxed ? 'Точных совпадений немного — добавили близкие варианты. Можно уточнить пожелание.' : undefined };
}
