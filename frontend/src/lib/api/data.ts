import assignment from '../../data/movies.json';
import prototype from '../../data/prototype.json';
import details from '../../data/movie-details.json';
import type { Movie, Collection } from '../types';
const topicRules: [string, RegExp][] = [['detective', /детектив/], ['animation', /анимация/], ['family', /семейный/], ['fantasy', /фэнтези/], ['comedy', /комедия/], ['authors', /драма|документальный|биографический/]];
const baseMovies: Movie[] = [
  ...assignment.movies.map(raw => {
    const genres = raw.details.genres;
    const mood = raw.content.mood;
    const moods = [...(/тёпл|тепл|нежн/.test(mood.toLowerCase()) ? ['cozy'] : []), ...(/ностальг/.test(mood) ? ['childhood'] : []), ...(/лёгк|иронич|юмор/.test(mood.toLowerCase()) ? ['light'] : []), ...(/тревож|напряж|скорб/.test(mood.toLowerCase()) ? ['tension'] : []), 'thoughtful'];
    return {
      id: String(raw.identification.kinopoisk_id), title: raw.identification.title_ru, originalTitle: raw.identification.title_original,
      year: raw.identification.year, runtime: raw.details.runtime_minutes, age: raw.details.age_ratings.find(x => x.country === 'Россия')?.rating,
      genres, countries: raw.details.countries, poster: '/assets/' + raw.poster.path,
      kp: raw.ratings.kinopoisk?.value ?? null, imdb: raw.ratings.imdb?.value ?? null,
      mood: mood.split(/[;,]/)[0], logline: raw.content.logline, synopsis: raw.content.synopsis,
      topics: topicRules.filter(([, rule]) => genres.some(g => rule.test(g))).map(([id]) => id), moods,
      people: [...raw.creators.directors.map(name => ({ name, role: 'Режиссёр' })), ...raw.cast.slice(0, 4).map(p => ({ name: p.name_ru, role: p.role }))],
      awards: (raw.recognition.awards ?? []).map(a => ({ title: `${a.event} ${a.year}`, category: a.category, result: a.result === 'win' ? 'win' as const : 'nomination' as const })),
      media: [{ type: 'trailer' as const, image: '/assets/' + raw.poster.path, label: 'Трейлер', url: raw.links.official_trailer.url }],
      reviews: null, links: [{ label: 'Проверить просмотр на Кинопоиске', url: raw.identification.kinopoisk_url }], origin: 'assignment' as const,
    };
  }),
  ...prototype as Movie[],
];
// Keep the assignment intact; sourced detail records enrich both catalogue origins.
const movieDetails = details as Record<string, Partial<Movie>>;
export const movies: Movie[] = baseMovies.map(movie => ({ ...movie, ...movieDetails[movie.id] }));
const topicsBase = [
  ['super', 'Супергероика', 'Сверхсилы и необычные герои'], ['detective', 'Детективы', 'Тайны, улики и расследования'],
  ['action', 'Перестрелки', 'Экшен и приключения'], ['authors', 'Авторское кино', 'Необычный взгляд на мир'],
  ['comedy', 'Комедии', 'Ирония и смешные истории'], ['scifi', 'Фантастика', 'За пределами привычного'],
  ['fantasy', 'Фэнтези', 'Магия и другие миры'], ['animation', 'Анимация', 'Рисованные истории'],
  ['family', 'Для всей семьи', 'Посмотреть вместе'], ['crime', 'Криминал', 'По другую сторону закона'],
];
const moodsBase = [
  ['cozy', 'Уютный вечер', 'Тепло и добрый юмор'], ['childhood', 'Назад в детство', 'Знакомые герои'],
  ['energy', 'Взбодриться', 'Темп и приключения'], ['light', 'Легко и с улыбкой', 'Меньше тяжёлых переживаний'],
  ['tension', 'Пощекотать нервы', 'Напряжение и загадки'], ['thoughtful', 'Есть о чём подумать', 'Истории с послевкусием'],
];
function collections(items: string[][], field: 'topics' | 'moods'): Collection[] {
  return items.map(([id, title, description]) => ({ id, title, description, posters: movies.filter(m => m[field].includes(id)).slice(0, 4).map(m => m.poster) }));
}
export const topics = collections(topicsBase, 'topics');
export const moods = collections(moodsBase, 'moods');
