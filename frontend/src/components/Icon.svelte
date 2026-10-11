<script lang="ts">
  let { name, size = 22 }: { name: string; size?: number } = $props();
  const paths: Record<string, string> = {
    bookmark: 'M6 3h12v18l-6-4-6 4z', eye: 'M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0',
    left: 'm15 5-7 7 7 7', right: 'm9 5 7 7-7 7', close: 'm6 6 12 12M6 18 18 6', plus: 'M12 5v14M5 12h14',
    play: 'm8 4 12 8-12 8z', check: 'm4 12 5 5L20 6', info: 'M12 10v7M12 6v1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0',
    chat: 'M4 4h16v12H9l-5 4zM8 8h8M8 12h5', arrow: 'M5 19 19 5M7 5h12v12', trophy: 'M7 3h10v6a5 5 0 0 1-10 0zM7 5H3v3a4 4 0 0 0 4 4M17 5h4v3a4 4 0 0 1-4 4M12 14v7M7 21h10',
  };
</script>
<svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d={paths[name] || paths.info}/></svg>
