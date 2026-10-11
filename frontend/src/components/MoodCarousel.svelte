<script lang="ts">
  import { onMount } from 'svelte';
  import type { Collection } from '../lib/types';
  import ThemeCard from './ThemeCard.svelte';
  import Icon from './Icon.svelte';
  let { items, selected, onselect }: { items: Collection[]; selected: string; onselect: (id: string) => void } = $props();
  let track: HTMLDivElement;
  let left = $state(false), right = $state(false);
  function measure() { left = track.scrollLeft > 2; right = track.scrollLeft + track.clientWidth < track.scrollWidth - 2; }
  onMount(() => { const observer = new ResizeObserver(measure); observer.observe(track); measure(); return () => observer.disconnect(); });
  function scroll(direction: number) { track.scrollBy({ left: direction * (track.clientWidth * .7), behavior: 'smooth' }); }
</script>
<section class="moods"><h2>Сменить настроение</h2><p class="muted">Настроение дополнит выбранную историю</p><div class="carousel" class:fade-left={left} class:fade-right={right}>
  {#if left}<button class="carousel-arrow previous icon-button" aria-label="Предыдущие настроения" onclick={() => scroll(-1)}><Icon name="left"/></button>{/if}
  <div class="mood-track" bind:this={track} onscroll={measure}>{#each items as item}<ThemeCard {item} selected={selected === item.id} onclick={() => onselect(selected === item.id ? '' : item.id)}/>{/each}</div>
  {#if right}<button class="carousel-arrow next icon-button" aria-label="Следующие настроения" onclick={() => scroll(1)}><Icon name="right"/></button>{/if}
</div></section>
