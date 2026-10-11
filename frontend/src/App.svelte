<script lang="ts">
  import { route, follow } from './lib/router';
  import { preferences, storageUnavailable } from './lib/preferences';
  import { todayHref } from './lib/catalogState';
  import Catalog from './pages/Catalog.svelte';
  import Film from './pages/Film.svelte';
</script>
<svelte:window onclick={follow}/>
<div class="app-shell">
  <header class="site-header"><a class="logo" href={$todayHref} aria-label="kinoeve — главная">kinoeve.</a><nav aria-label="Основная навигация"><a href={$todayHref} aria-current={$route.page === 'catalog' && !$route.search.has('saved') ? 'page' : undefined} class:current={$route.page === 'catalog' && !$route.search.has('saved')}>Сегодня</a><a href="/?saved=1" aria-current={$route.search.has('saved') ? 'page' : undefined} class:current={$route.search.has('saved')}>На потом{#if $preferences.saved.length}<span class="nav-count">{$preferences.saved.length}</span>{/if}</a></nav><span class="header-note">Кино под твой вечер</span></header>
  <main>
    {#if $route.page === 'catalog'}<Catalog search={$route.search}/>
    {:else if $route.page === 'movie'}{#key $route.id}<Film id={$route.id} search={$route.search}/>{/key}
    {:else}<div class="empty-state"><h1>Такой страницы нет</h1><p class="muted">Вернёмся к выбору кино?</p><a class="primary" href="/">К подборке</a></div>{/if}
  </main>
  {#if $storageUnavailable}<p class="storage-notice" role="status">Браузер не смог сохранить список. Отметки останутся до закрытия страницы.</p>{/if}
</div>
