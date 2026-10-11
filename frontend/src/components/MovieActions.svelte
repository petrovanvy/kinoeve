<script lang="ts">
  import { preferences, togglePreference } from '../lib/preferences';
  import Icon from './Icon.svelte';
  let { id }: { id: string } = $props();
</script>
<button class="icon-button" class:active={$preferences.saved.includes(id)} aria-label={$preferences.saved.includes(id) ? 'Убрать из сохранённого' : 'Сохранить на потом'} aria-pressed={$preferences.saved.includes(id)} onclick={() => togglePreference('saved', id)}><Icon name="bookmark"/></button>
<button class="icon-button" class:active={$preferences.watched.includes(id)} aria-label="Уже смотрел" aria-pressed={$preferences.watched.includes(id)} onclick={() => togglePreference('watched', id)}><Icon name="eye"/></button>
