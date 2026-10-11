export interface Person { name: string; role: string; photo?: string }
export interface ReviewTag { label: string; query: string }
export interface Movie {
  id: string; title: string; originalTitle?: string; year: number;
  runtime: number | null; age?: string; genres: string[]; countries: string[];
  poster: string; kp: number | null; imdb: number | null; mood: string; logline: string; synopsis: string;
  badge?: string; topics: string[]; moods: string[];
  people: Person[]; awards: { title: string; category: string; result: 'win' | 'nomination' }[];
  media: { type: 'image' | 'trailer'; image: string; label: string; url?: string; embedUrl?: string; videoUrl?: string }[];
  reviews: { praise: ReviewTag[]; caveats: string[]; sources: { label: string; url: string }[] } | null;
  links: { label: string; url: string }[]; origin: 'assignment' | 'prototype';
  detailSources?: { label: string; url: string }[];
}
export interface Collection { id: string; title: string; description: string; posters: string[] }
export interface RecommendationQuery { topic: string; mood?: string; primary?: 'topic' | 'mood'; refinement?: string; query?: string }
export interface RecommendationResult { movies: Movie[]; relaxed: boolean; message?: string }
export interface MoviesApi {
  getCollections(signal?: AbortSignal): Promise<{ topics: Collection[]; moods: Collection[] }>;
  getRecommendations(query: RecommendationQuery, signal?: AbortSignal): Promise<RecommendationResult>;
  getMovie(id: string, signal?: AbortSignal): Promise<Movie>;
  getMovies(ids: string[], signal?: AbortSignal): Promise<Movie[]>;
}
