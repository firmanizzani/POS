<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/authStore';

  let isMounted = false;

  onMount(() => {
    isMounted = true;
    const unsubscribe = authStore.subscribe((user) => {
      const isLoginPage = $page.url.pathname === '/login';
      if (!user && !isLoginPage) {
        goto('/login');
      }
    });
    return unsubscribe;
  });
</script>

{#if isMounted}
  <slot />
{:else}
  <div class="min-h-screen bg-slate-100 flex items-center justify-center">
    <div class="w-6 h-6 border-2 border-sky-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
{/if}
