<script lang="ts">
  import { onMount } from 'svelte';
  import type { Collection } from '../lib/types';
  import ThemeCard from './ThemeCard.svelte';
  import Icon from './Icon.svelte';
  let { items, selected, onselect, heading = 'Сменить настроение', subtitle = 'Подборка под твой вечер', kind = 'moods' }: { items: Collection[]; selected: string; onselect: (id: string) => void; heading?: string; subtitle?: string; kind?: 'topics' | 'moods' } = $props();
  let track: HTMLDivElement;
  let left = $state(false), right = $state(false);
  function measure() { left = track.scrollLeft > 2; right = track.scrollLeft + track.clientWidth < track.scrollWidth - 2; }
  onMount(() => { const observer = new ResizeObserver(measure); observer.observe(track); measure(); return () => observer.disconnect(); });
  function scroll(direction: number) { track.scrollBy({ left: direction * (track.clientWidth * .7), behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' }); }
</script>
<section class="moods"><h2>{heading}</h2><p class="muted">{subtitle}</p><div class="carousel" class:fade-left={left} class:fade-right={right}>
  {#if left}<button class="carousel-arrow previous icon-button" aria-label={kind === 'topics' ? 'Предыдущие темы' : 'Предыдущие настроения'} onclick={() => scroll(-1)}><Icon name="left"/></button>{/if}
  <div class="mood-track" bind:this={track} onscroll={measure}>{#each items as item}<ThemeCard {item} selected={selected === item.id} onclick={() => onselect(item.id)}/>{/each}</div>
  {#if right}<button class="carousel-arrow next icon-button" aria-label={kind === 'topics' ? 'Следующие темы' : 'Следующие настроения'} onclick={() => scroll(1)}><Icon name="right"/></button>{/if}
</div></section>
