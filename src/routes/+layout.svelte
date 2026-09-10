<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { authStore } from '$lib/stores/authStore';

  onMount(() => {
    // If not logged in and not already on /login, redirect to login
    const unsubscribe = authStore.subscribe((user) => {
      const isLoginPage = $page.url.pathname === '/login';
      if (!user && !isLoginPage) {
        goto('/login');
      }
    });
    return unsubscribe;
  });
</script>

<slot />
