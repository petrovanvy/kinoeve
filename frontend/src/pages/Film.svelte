<script lang="ts">
  import { getApi } from '../lib/api';
  import { ApiError } from '../lib/api/http';
  import type { Movie } from '../lib/types';
  import Rating from '../components/Rating.svelte';
  import MovieActions from '../components/MovieActions.svelte';
  import Icon from '../components/Icon.svelte';
  let { id, search }: { id: string; search: URLSearchParams } = $props();
  let movie = $state<Movie | null>(null), loading = $state(true), error = $state(''), missing = $state(false), retry = $state(0);
  let current = $state(0), playing = $state(false), providers = $state(false), reviews = $state(false), expandedSynopsis = $state(false);
  let dialog = $state<HTMLDialogElement>();
  const back = $derived(search.get('from')?.startsWith('/?') || search.get('from') === '/' ? search.get('from')! : '/');
  const media = $derived(movie?.media.length ? movie.media : movie ? [{ type: 'image' as const, image: movie.poster, label: movie.title }] : []);
  const active = $derived(media[current]);
  function show(index: number) { current = index; playing = false; }
  $effect(() => {
    retry;
    const controller = new AbortController();
    loading = true; error = ''; missing = false;
    (async () => { try { const result = await (await getApi()).getMovie(id, controller.signal); if (!controller.signal.aborted) movie = result; }
      catch (e) { if (!controller.signal.aborted) { error = e instanceof Error ? e.message : 'Не удалось загрузить фильм'; missing = e instanceof ApiError && e.status === 404; } }
      finally { if (!controller.signal.aborted) loading = false; }
    })();
    return () => controller.abort();
  });
  $effect(() => { if (reviews && dialog) dialog.showModal(); });
</script>
<svelte:head><title>{movie?.title || 'Фильм'} — kinoeve</title></svelte:head>
<a class="back-link" href={back}>← К подборке</a>
{#if loading}<div class="detail-skeleton" aria-busy="true" aria-label="Загрузка фильма"></div>
{:else if error}<div class="empty-state" role="alert"><h1>{missing ? 'Фильм не найден' : 'Не получилось открыть фильм'}</h1><p>{error}</p>{#if !missing}<button class="primary" onclick={() => retry++}>Попробовать ещё раз</button>{/if}<a href="/" class="text-button">К подборке</a></div>
{:else if movie}
  <section class="film-hero" aria-label="О фильме"><div class="film-media"><div class="media-stage" class:poster-preview={!movie.media.length || (movie.origin === 'assignment')}>
    {#if playing && active.embedUrl}<iframe src={active.embedUrl} title={`Трейлер «${movie.title}»`} allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>
    {:else}<img src={active.image} alt={active.label}/><div class="media-shade"></div>{#if active.type === 'trailer'}{#if active.embedUrl}<button class="play-button" aria-label="Посмотреть трейлер" onclick={() => playing = true}><Icon name="play" size={28}/></button>{:else if active.url}<a class="play-button" href={active.url} target="_blank" rel="noopener noreferrer" aria-label="Открыть трейлер"><Icon name="play" size={28}/></a>{/if}{/if}<div class="media-footer"><strong>{active.type === 'trailer' ? 'Трейлер' : active.label}</strong>{#if active.url && !active.embedUrl}<small>На сайте источника ↗</small>{:else if media.length > 1}<small>{current + 1} / {media.length}</small>{/if}</div>{/if}
    {#if current > 0}<button class="media-arrow previous icon-button" aria-label="Предыдущее медиа" onclick={() => show(current - 1)}><Icon name="left"/></button>{/if}{#if current < media.length - 1}<button class="media-arrow next icon-button" aria-label="Следующее медиа" onclick={() => show(current + 1)}><Icon name="right"/></button>{/if}
  </div>{#if media.length > 1}<div class="media-strip">{#each media as item, i}<button class="media-thumb" aria-label={item.type === 'trailer' ? 'Трейлер' : `Кадр ${i}`} aria-pressed={current === i} onclick={() => show(i)}><img src={item.image} alt=""/>{#if item.type === 'trailer'}<span><Icon name="play" size={16}/>Трейлер</span>{/if}</button>{/each}</div>{/if}</div>
  <div class="film-summary"><h1>{movie.title}</h1>{#if movie.originalTitle}<p class="original-title muted">{movie.originalTitle}</p>{/if}<p class="muted film-meta">{movie.year}{#if movie.runtime} · {Math.floor(movie.runtime / 60)} ч {movie.runtime % 60 ? `${movie.runtime % 60} мин` : ''}{/if}{#if movie.age} · {movie.age}{/if}{#if movie.genres.length || movie.countries.length}<br/>{[...movie.genres, ...movie.countries].join(' · ')}{/if}</p><div class="ratings"><Rating source="kp" value={movie.kp}/><Rating source="imdb" value={movie.imdb}/></div><p class="film-character">{movie.mood}</p><p class="synopsis">{movie.synopsis.length > 420 && !expandedSynopsis ? movie.logline : movie.synopsis}</p>{#if movie.synopsis.length > 420}<button class="text-button synopsis-toggle" aria-expanded={expandedSynopsis} onclick={() => expandedSynopsis = !expandedSynopsis}>{expandedSynopsis ? "Свернуть сюжет" : "Подробнее о сюжете"}</button>{/if}<div class="detail-actions">{#if movie.links.length}<button class="primary" aria-expanded={providers} onclick={() => providers = !providers}>Где посмотреть</button>{/if}<MovieActions id={movie.id}/></div>{#if providers}<div class="providers">{#each movie.links as link}<a href={link.url} target="_blank" rel="noopener noreferrer">{link.label} ↗</a>{/each}<small class="muted">Доступность и условия — на сайте площадки.</small></div>{/if}</div></section>
  {#if movie.reviews}<section class="review-section"><div class="section-heading"><h2>Что отмечают в отзывах</h2><button class="text-button muted" onclick={() => reviews = true}>Читать рецензии ↗</button></div><div class="review-box"><div><p class="review-label"><Icon name="check" size={18}/>Хвалят</p><div class="chips">{#each movie.reviews.praise as tag}<a class="chip" href={`/?topic=${movie.topics[0]}&q=${encodeURIComponent(tag.query)}`}><Icon name="chat" size={18}/>{tag.label} ↗</a>{/each}</div></div><div><p class="review-label"><Icon name="info" size={18}/>Стоит учитывать</p><div class="caveat-row">{#each movie.reviews.caveats as caveat}<span class="chip"><Icon name="chat" size={18}/>{caveat}</span>{/each}<a class="text-button" href={`/?topic=${movie.topics[0]}&refinement=energy`}>Хочу динамичнее →</a></div></div></div></section>
  {:else if movie.origin === 'assignment'}<div class="review-link"><a class="text-button muted" href={`${movie.links[0].url}reviews/`} target="_blank" rel="noopener noreferrer">Читать отзывы на Кинопоиске ↗</a></div>{/if}
  {#if movie.people.length}<section class="people-section"><h2>Режиссёр и главные роли</h2><div class="people-row">{#each movie.people as person, i}<figure class="person" class:director={i === 0}>{#if person.photo}<img src={person.photo} alt={person.name}/>{:else}<div class="person-placeholder" aria-hidden="true">{person.name.split(' ').map(n => n[0]).slice(0, 2).join('')}</div>{/if}<figcaption>{person.name}<small>{person.role}</small></figcaption></figure>{/each}</div></section>{/if}
  {#if movie.awards.length}<section class="awards" aria-label="Премии"><Icon name="trophy" size={28}/><div>{#each movie.awards.slice(0, 2) as award}<p><strong>{award.title}</strong><small class="muted">{award.result === 'win' ? 'Премия' : 'Номинация'} · {award.category}</small></p>{/each}{#if movie.awards.length > 2}<details><summary>Ещё {movie.awards.length - 2}</summary>{#each movie.awards.slice(2) as award}<p><strong>{award.title}</strong><small class="muted">{award.result === 'win' ? 'Премия' : 'Номинация'} · {award.category}</small></p>{/each}</details>{/if}</div></section>{/if}
  {#if reviews && movie.reviews}<dialog bind:this={dialog} class="reviews-modal" aria-labelledby="reviews-title" onclose={() => reviews = false}><div class="modal-head"><h2 id="reviews-title">Рецензии</h2><button class="icon-button" aria-label="Закрыть рецензии" onclick={() => reviews = false}><Icon name="close"/></button></div><p class="muted">Короткие тезисы — редакционная выдержка из этих источников.</p><ul>{#each movie.reviews.sources as source}<li><a href={source.url} target="_blank" rel="noopener noreferrer">{source.label} ↗</a></li>{/each}</ul></dialog>{/if}
{/if}
