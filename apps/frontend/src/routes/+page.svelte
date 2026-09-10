<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  onMount(() => {
    goto('/kasir');
  });
</script>

<div class="h-full flex flex-col items-center justify-center space-y-3 text-slate-400">
  <div class="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
  <p class="text-xs font-semibold">Mengarahkan ke Sistem Kasir POS...</p>
</div>
