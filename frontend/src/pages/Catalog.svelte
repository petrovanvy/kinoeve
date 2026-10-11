<script lang="ts">
  import { getApi } from '../lib/api';
  import { navigate } from '../lib/router';
  import { preferences } from '../lib/preferences';
  import type { Collection, Movie } from '../lib/types';
  import MovieCard from '../components/MovieCard.svelte';
  import ThemeModal from '../components/ThemeModal.svelte';
  import MoodCarousel from '../components/MoodCarousel.svelte';
  import Icon from '../components/Icon.svelte';
  let { search }: { search: URLSearchParams } = $props();
  let topics = $state<Collection[]>([]), moods = $state<Collection[]>([]), films = $state<Movie[]>([]);
  let loading = $state(true), error = $state(''), message = $state(''), showThemes = $state(false), describe = $state(false), words = $state(''), retry = $state(0);
  const topic = $derived(search.get('topic') || 'super');
  const mood = $derived(search.get('mood') || '');
  const refinement = $derived(search.get('refinement') || '');
  const query = $derived(search.get('q') || '');
  const saved = $derived(search.has('saved'));
  const count = $derived([3, 6, 9].includes(Number(search.get('count'))) ? Number(search.get('count')) : 3);
  const title = $derived(topics.find(t => t.id === topic)?.title || 'Супергероика');
  const requestKey = $derived(JSON.stringify([topic, mood, refinement, query, saved, saved ? $preferences.saved.join(',') : '', retry]));
  function update(values: Record<string, string>, reset = true) {
    const params = new URLSearchParams(search);
    params.delete('saved');
    for (const [key, value] of Object.entries(values)) { if (value) params.set(key, value); else params.delete(key); }
    if (reset) params.delete('count');
    navigate('/?' + params, false, false);
  }
  $effect(() => {
    requestKey;
    const controller = new AbortController();
    const currentQuery = { topic, mood, refinement, query };
    const ids = saved ? [...$preferences.saved] : [];
    const savedMode = saved;
    loading = true; error = ''; message = '';
    (async () => {
      try {
        const api = await getApi();
        const [collections, results] = await Promise.all([api.getCollections(controller.signal), savedMode ? api.getMovies(ids, controller.signal).then(movies => ({ movies, relaxed: false, message: undefined })) : api.getRecommendations(currentQuery, controller.signal)]);
        if (controller.signal.aborted) return;
        topics = collections.topics; moods = collections.moods; films = results.movies; message = results.message || '';
      } catch (e) { if (!controller.signal.aborted) error = e instanceof Error ? e.message : 'Не удалось загрузить фильмы'; }
      finally { if (!controller.signal.aborted) loading = false; }
    })();
    return () => controller.abort();
  });
  const refinements = $derived(count < 6 ? [['humor', 'Больше юмора'], ['animation', 'Более мультяшное'], ['energy', 'Больше движения']] : count < 9 ? [['humor', 'Больше юмора'], ['lighter', 'Полегче'], ['energy', 'Хочу динамичнее']] : [['humor', 'Больше юмора'], ['lighter', 'Слишком мрачно'], ['energy', 'Мало движения']]);
</script>
<svelte:head><title>{saved ? 'На потом' : 'Кино на вечер'} — kinoeve</title></svelte:head>
<section class="catalog-intro"><p class="eyebrow">{saved ? 'Твой список' : 'Вечер начинается с хорошего кино'}</p><h1>{#if saved}Оставили на потом{:else}Сегодня — <button class="topic-title" onclick={() => showThemes = true}>{title.toLowerCase()}</button>{/if}</h1><p class="intro-subtitle">{saved ? 'Фильмы, к которым хочется вернуться.' : query ? `Под пожелание «${query}»` : refinement === 'humor' ? 'Больше юмора — меньше мрачности. Попробуем эту подборку.' : 'Три разные истории. Выбери свою — или подскажи, чего хочется.'}</p></section>
{#if error}<div class="empty-state" role="alert"><h2>Не получилось загрузить подборку</h2><p>{error}</p><button class="primary" onclick={() => retry++}>Попробовать ещё раз</button></div>
{:else if loading}<div class="movie-grid" aria-label="Загрузка фильмов" aria-busy="true">{#each [0, 1, 2] as i}<div class="card-skeleton"><div></div><span></span></div>{/each}</div>
{:else if saved && !films.length}<div class="empty-state"><Icon name="bookmark" size={40}/><h2>Здесь будут твои находки</h2><p class="muted">Нажми на закладку у фильма, чтобы сохранить его на другой вечер.</p><a href="/" class="primary">Выбрать кино</a></div>
{:else}
  {#if message}<p class="match-note" role="status">{message}</p>{/if}
  <div class="movie-grid">{#each (saved ? films : films.slice(0, count)) as movie (movie.id)}<MovieCard {movie} from={'/' + (search.size ? '?' + search : '')}/>{/each}</div>
  {#if !saved}
    {#if count < 9 && films.length > count}<button class="more-button" onclick={() => update({ count: String(count + 3) }, false)}><Icon name="plus" size={18}/>Ещё 3</button>{/if}
    <section class="refinements"><div class="section-heading"><h2>{count >= 9 ? 'Что мешает выбрать?' : count >= 6 ? 'Чего добавить в подборку?' : 'Чего хочется больше?'}</h2><p class="muted">{count >= 9 ? 'Уточни — и соберём новую тройку' : 'Подстроим истории под твой вечер'}</p></div><div class="refinement-row"><div class="chips">{#each refinements as [id, label]}<button class="chip" class:active={refinement === id} aria-pressed={refinement === id} onclick={() => update({ refinement: refinement === id ? '' : id, ...(id === 'animation' ? { topic: 'animation' } : {}) })}>{label}</button>{/each}{#if mood || refinement || query}<button class="text-button muted" onclick={() => update({ mood: '', refinement: '', q: '' })}>Сбросить пожелания</button>{/if}</div><button class="text-button describe-toggle" aria-expanded={describe} onclick={() => { describe = !describe; words = query; }}>Описать словами</button></div>{#if describe}<form class="query-form" onsubmit={event => { event.preventDefault(); update({ q: words.trim() }); describe = false; }}><label for="wish">Какое кино хочется сегодня?</label><div><input id="wish" bind:value={words} maxlength="200" placeholder="Например, лёгкий детектив с юмором"/><button class="primary" type="submit">Подобрать</button></div></form>{/if}</section>
    <MoodCarousel items={moods} selected={mood} onselect={id => update({ mood: id })}/>
  {/if}
{/if}
{#if showThemes}<ThemeModal items={topics} selected={topic} onselect={id => update({ topic: id })} onclose={() => showThemes = false}/>{/if}
