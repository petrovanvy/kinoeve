<script lang="ts">
  import type { Movie } from '../lib/types';
  import Rating from './Rating.svelte';
  import MovieActions from './MovieActions.svelte';
  let { movie, from = '/' }: { movie: Movie; from?: string } = $props();
  const href = $derived(`/movies/${movie.id}?from=${encodeURIComponent(from)}`);
  const metadata = $derived([String(movie.year), ...(movie.runtime ? [`${movie.runtime} мин`] : []), ...(movie.age ? [movie.age] : [])].join(' · '));
</script>
<div class="movie-card-container"><article class="movie-card">
  <a class="poster-link" {href} aria-label={`Подробнее: ${movie.title}`}><img src={movie.poster} alt={`Постер «${movie.title}»`} loading="lazy"/>{#if movie.badge}<span class="film-badge">{movie.badge}</span>{/if}</a>
  <div class="movie-card-info"><p class="film-mood">{movie.mood}</p><h2><a {href}>{movie.title}</a></h2><p class="muted card-meta">{metadata}</p><div class="ratings"><Rating source="kp" value={movie.kp}/><Rating source="imdb" value={movie.imdb}/></div></div><p class="card-reason">{movie.logline}</p><div class="card-actions"><a class="primary" {href}>Подробнее</a><MovieActions id={movie.id}/></div>
</article></div>
