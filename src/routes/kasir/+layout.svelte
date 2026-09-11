<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore';
  import { Store, ShoppingCart, LogOut, Clock, User } from 'lucide-svelte';

  onMount(() => {
    const unsubscribe = authStore.subscribe((user) => {
      if (!user) {
        goto('/login');
      } else if (user.role !== 'cashier' && user.role !== 'admin') {
        goto('/login');
      }
    });
    return unsubscribe;
  });

  function logout() {
    authStore.logout();
    goto('/login');
  }
</script>

<div class="min-h-screen flex flex-col bg-slate-100 text-slate-900">
  <!-- Top Kasir Header -->
  <header class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
    <div class="flex items-center space-x-3">
      <div class="bg-sky-600 p-2 rounded-xl text-white font-bold shadow-md shadow-sky-600/20">
        <ShoppingCart class="w-5 h-5" />
      </div>
      <div>
        <h1 class="text-base font-black text-slate-900 tracking-wide">KASIR POS</h1>
        <p class="text-[11px] text-sky-600 font-semibold">PopMart</p>
      </div>
    </div>

    <!-- Session Info + Logout -->
    <div class="flex items-center space-x-4">
      {#if $authStore}
        <div class="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <div class="bg-sky-100 p-1.5 rounded-lg">
            <User class="w-4 h-4 text-sky-600" />
          </div>
          <div class="text-right">
            <p class="text-xs font-bold text-slate-900">{$authStore.name}</p>
            <div class="flex items-center space-x-1.5">
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span class="text-[10px] text-emerald-600 font-semibold capitalize">Shift Aktif</span>
            </div>
          </div>
        </div>

        <button
          on:click={logout}
          class="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-colors flex items-center space-x-1 text-xs font-bold"
          title="Keluar dari Sistem"
        >
          <LogOut class="w-4 h-4" />
          <span>Keluar</span>
        </button>
      {/if}
    </div>
  </header>

  <!-- Kasir Main Content Area -->
  <main class="flex-1 flex flex-col overflow-hidden bg-slate-100">
    <slot />
  </main>
</div>
