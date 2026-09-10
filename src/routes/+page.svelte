<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore';

  onMount(() => {
    const unsubscribe = authStore.subscribe((user) => {
      if (!user) {
        goto('/login');
      } else if (user.role === 'admin') {
        goto('/admin');
      } else {
        goto('/kasir');
      }
    });
    return unsubscribe;
  });
</script>

<div class="h-screen flex flex-col items-center justify-center space-y-3 text-slate-400 bg-slate-100">
  <div class="w-8 h-8 border-4 border-sky-500 border-t-transparent rounded-full animate-spin"></div>
  <p class="text-xs font-semibold">Mengarahkan...</p>
</div>
