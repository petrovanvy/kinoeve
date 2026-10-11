<script lang="ts">
  import { onMount } from 'svelte';
  import type { Collection } from '../lib/types';
  import ThemeCard from './ThemeCard.svelte';
  import Icon from './Icon.svelte';
  let { items, selected, onselect, onclose, heading = 'Какую историю посмотрим?', subtitle = 'Выбери основу для новой подборки.' }: { items: Collection[]; selected: string; onselect: (id: string) => void; onclose: () => void; heading?: string; subtitle?: string } = $props();
  let dialog: HTMLDialogElement;
  onMount(() => { dialog.showModal(); return () => dialog.close(); });
</script>
<dialog bind:this={dialog} class="theme-modal" aria-labelledby="themes-title" onclose={onclose}>
  <div class="modal-head"><div><h2 id="themes-title">{heading}</h2><p class="muted">{subtitle}</p></div><button class="icon-button" aria-label="Закрыть выбор темы" onclick={onclose}><Icon name="close"/></button></div>
  <div class="modal-scroll"><div class="themes-grid">{#each items as item}<ThemeCard {item} selected={item.id === selected} onclick={() => { onselect(item.id); onclose(); }}/>{/each}</div></div>
</dialog>
