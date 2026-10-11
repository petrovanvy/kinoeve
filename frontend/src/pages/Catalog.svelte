<script lang="ts">
  import { untrack } from 'svelte';
  import { get } from 'svelte/store';
  import { getApi } from '../lib/api';
  import { navigate } from '../lib/router';
  import { preferences } from '../lib/preferences';
  import { catalogState, todayHref, catalogUrl, readCatalogState, refineCatalog, nextRefinements, refinementUsage, recordRefinementClick, recommendationQuery, recommendationKey, recommendationCache, collectionCache, cacheCollections, cacheRecommendations } from '../lib/catalogState';
  import type { CatalogState } from '../lib/catalogState';
  import type { Collection, Movie } from '../lib/types';
  import MovieCard from '../components/MovieCard.svelte';
  import ThemeModal from '../components/ThemeModal.svelte';
  import MoodCarousel from '../components/MoodCarousel.svelte';
  import Icon from '../components/Icon.svelte';
  let { search }: { search: URLSearchParams } = $props();
  let topics = $state<Collection[]>(collectionCache?.topics || []), moods = $state<Collection[]>(collectionCache?.moods || []), films = $state<Movie[]>([]);
  let loading = $state(true), error = $state(''), message = $state(''), showThemes = $state(false), describe = $state(false), words = $state(''), retry = $state(0);
  const saved = $derived(search.has('saved'));
  const selection = $derived($catalogState);
  const moodFirst = $derived(selection.primary === 'mood');
  const title = $derived((moodFirst ? moods : topics).find(item => item.id === (moodFirst ? selection.mood : selection.topic))?.title || (!moodFirst && selection.topic === 'super' ? 'Супергероика' : ''));
  const count = $derived(selection.count);
  const request = $derived(recommendationQuery(selection));
  const requestKey = $derived(recommendationKey(request));
  const savedKey = $derived(saved ? $preferences.saved.join(',') : '');
  const refinements = $derived(nextRefinements(selection, $refinementUsage));
  function update(values: Partial<CatalogState>, reset = true) {
    const next = { ...get(catalogState), ...values, ...(reset ? { count: 3 as const } : {}) };
    catalogState.set(next);
    navigate(catalogUrl(next), false, false);
  }
  function choose(kind: 'topic' | 'mood', id: string) {
    // The new choice leads the selection; the previous direction is offered below, not applied invisibly.
    update({ primary: kind, topic: kind === 'topic' ? id : 'super', mood: kind === 'mood' ? id : '', refinement: '', consumed: [], query: '' });
  }
  function refine(id: string) {
    const current = get(catalogState);
    const next = refineCatalog(current, id);
    if (next === current) return;
    recordRefinementClick(id);
    catalogState.set(next);
    navigate(catalogUrl(next), false, false);
  }
  $effect(() => {
    const incoming = search;
    if (incoming.has('saved')) return;
    untrack(() => {
      if (incoming.size) catalogState.set(readCatalogState(incoming));
      else navigate(get(todayHref), true, false);
    });
  });
  $effect(() => {
    const key = requestKey, savedMode = saved, idsKey = savedKey;
    retry;
    const currentQuery = untrack(() => request);
    const cached = !savedMode ? recommendationCache.get(key) : undefined;
    if (cached && collectionCache) {
      topics = collectionCache.topics; moods = collectionCache.moods;
      films = cached.movies; message = cached.message || ''; error = ''; loading = false;
      return;
    }
    const controller = new AbortController();
    loading = true; error = ''; message = '';
    (async () => {
      try {
        const api = await getApi();
        const [collections, results] = await Promise.all([
          collectionCache || api.getCollections(controller.signal),
          savedMode ? api.getMovies(idsKey ? idsKey.split(',') : [], controller.signal).then(movies => ({ movies, relaxed: false, message: undefined })) : api.getRecommendations(currentQuery, controller.signal),
        ]);
        if (controller.signal.aborted) return;
        cacheCollections(collections);
        if (!savedMode) cacheRecommendations(key, results);
        topics = collections.topics; moods = collections.moods; films = results.movies; message = results.message || '';
      } catch (e) { if (!controller.signal.aborted) error = e instanceof Error ? e.message : 'Не удалось загрузить фильмы'; }
      finally { if (!controller.signal.aborted) loading = false; }
    })();
    return () => controller.abort();
  });
</script>
<svelte:head><title>{saved ? 'На потом' : 'Кино на вечер'} — kinoeve</title></svelte:head>
<section class="catalog-intro"><h1>{#if saved}Оставили на потом{:else}Сегодня{#if title}{' — '}<button class="topic-title" onclick={() => showThemes = true}>{title.toLowerCase()}</button>{/if}{/if}</h1><p class="intro-subtitle">{saved ? 'Фильмы, к которым хочется вернуться.' : selection.query ? `Под пожелание «${selection.query}»` : 'Три разные истории. Выбери свою — или подскажи, чего хочется.'}</p></section>
{#if error}<div class="empty-state" role="alert"><h2>Не получилось загрузить подборку</h2><p>{error}</p><button class="primary" onclick={() => retry++}>Попробовать ещё раз</button></div>
{:else if loading}<div class="movie-grid" aria-label="Загрузка фильмов" aria-busy="true">{#each [0, 1, 2] as i}<div class="card-skeleton"><div></div><span></span></div>{/each}</div>
{:else if saved && !films.length}<div class="empty-state"><Icon name="bookmark" size={40}/><h2>Здесь будут твои находки</h2><p class="muted">Нажми на закладку у фильма, чтобы сохранить его на другой вечер.</p><a href={$todayHref} class="primary">Выбрать кино</a></div>
{:else}
  {#if message}<p class="match-note" role="status">{message}</p>{/if}
  <div class="movie-grid">{#each (saved ? films : films.slice(0, count)) as movie (movie.id)}<MovieCard {movie} from={saved ? '/?saved=1' : $todayHref}/>{/each}</div>
  {#if !saved}
    {#if count < 9 && films.length > count}<button class="more-button" onclick={() => update({ count: count === 3 ? 6 : 9 }, false)}><Icon name="plus" size={18}/>Ещё 3</button>{/if}
    <section class="refinements"><div class="section-heading"><h2>{count >= 9 ? 'Что мешает выбрать?' : count >= 6 ? 'Чего добавить в подборку?' : 'Чего хочется больше?'}</h2><p class="muted">{count >= 9 ? 'Уточни — и соберём новую тройку' : 'Подстроим истории под твой вечер'}</p></div><div class="refinement-row"><div class="chips">{#each refinements as action (action.id)}<button class="chip" onclick={() => refine(action.id)}>{action.label}</button>{/each}</div><button class="text-button describe-toggle" aria-expanded={describe} onclick={() => { describe = !describe; words = selection.query; }}>Описать словами</button></div>{#if describe}<form class="query-form" onsubmit={event => { event.preventDefault(); update({ query: words.trim(), refinement: '', consumed: [] }); describe = false; }}><label for="wish">Какое кино хочется сегодня?</label><div><input id="wish" bind:value={words} maxlength="200" placeholder="Например, лёгкий детектив с юмором"/><button class="primary" type="submit">Подобрать</button></div></form>{/if}</section>
    {#key moodFirst}<MoodCarousel items={moodFirst ? topics : moods} selected="" kind={moodFirst ? 'topics' : 'moods'} heading={moodFirst ? 'Попробовать другую тему' : 'Сменить настроение'} subtitle={moodFirst ? 'От супергероев до детективов — выбери новую историю' : 'Подборка под то, как хочется провести вечер'} onselect={id => choose(moodFirst ? 'topic' : 'mood', id)}/>{/key}
  {/if}
{/if}
{#if showThemes}<ThemeModal items={moodFirst ? moods : topics} selected={moodFirst ? selection.mood : selection.topic} heading={moodFirst ? 'Какое настроение выберем?' : 'Какую историю посмотрим?'} subtitle={moodFirst ? 'Выбери, как хочется провести этот вечер.' : 'Выбери основу для новой подборки.'} onselect={id => choose(moodFirst ? 'mood' : 'topic', id)} onclose={() => showThemes = false}/>{/if}
