<script lang="ts">
  let { source, value }: { source: 'kp' | 'imdb'; value: number | null } = $props();
</script>
{#if value !== null}
  <span class="rating" class:excellent={value >= 8} class:good={value >= 7 && value < 8} class:bad={value < 5} aria-label={`${source === 'kp' ? 'Кинопоиск' : 'IMDb'}: ${value} из 10`}>
    <img src={`/assets/icons/${source === 'kp' ? 'kinopoisk' : 'imdb'}.svg`} alt={source === 'kp' ? 'Кинопоиск' : 'IMDb'}/><b>{value.toFixed(1).replace('.', ',')}</b>
  </span>
{/if}
