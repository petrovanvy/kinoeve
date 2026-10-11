<script lang="ts">
  import type { Collection } from '../lib/types';
  let { item, selected = false, onclick }: { item: Collection; selected?: boolean; onclick: () => void } = $props();
</script>
<button class="theme-card" class:selected aria-pressed={selected} {onclick}>
  <span class="collage" aria-hidden="true">{#each item.posters.slice(0, 4) as poster}<img src={poster} alt="" loading="lazy"/>{/each}</span>
  <span class="theme-copy"><strong>{item.title}</strong><small>{item.description}</small></span>
</button>
