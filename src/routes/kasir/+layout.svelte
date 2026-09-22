<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount, onDestroy } from 'svelte';
  import { authStore } from '$lib/stores/authStore';
  import { shiftStore } from '$lib/stores/posStore';
  import { Store, ShoppingCart, LogOut, Clock, User } from 'lucide-svelte';

  // Jam WIB real-time
  let currentTimeWIB = '';

  function updateClock() {
    currentTimeWIB = new Date().toLocaleTimeString('id-ID', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    });
  }

  let clockInterval: ReturnType<typeof setInterval>;

  onMount(() => {
    updateClock();
    clockInterval = setInterval(updateClock, 1000);

    const unsubscribe = authStore.subscribe((user) => {
      if (!user) {
        goto('/login');
      } else if (user.role !== 'cashier' && user.role !== 'admin') {
        goto('/login');
      }
    });
    return unsubscribe;
  });

  onDestroy(() => {
    clearInterval(clockInterval);
  });

  function logout() {
    authStore.logout();
    goto('/login');
  }
</script>

<div class="min-h-screen flex flex-col bg-slate-100 text-slate-900 transition-opacity duration-200">
  <!-- Top Kasir Header -->
  <header class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
    <div class="flex items-center space-x-3">
      <div class="bg-sky-600 p-2 rounded-xl text-white font-bold shadow-md shadow-sky-600/20">
        <ShoppingCart class="w-5 h-5" />
      </div>
      <div>
        <h1 class="text-base font-black text-slate-900 tracking-wide">KASIR POS</h1>
        <p class="text-[11px] text-sky-600 font-semibold">VecMart</p>
      </div>
    </div>

    <!-- Jam WIB Real-Time -->
    <div class="flex items-center space-x-2 bg-slate-900 text-white rounded-xl px-4 py-2 shadow-md">
      <Clock class="w-4 h-4 text-sky-400 shrink-0" />
      <div class="text-center">
        <p class="text-sm font-black font-mono tracking-widest leading-none">{currentTimeWIB}</p>
        <p class="text-[9px] text-slate-400 font-semibold mt-0.5 uppercase tracking-wider">WIB · Indonesia</p>
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
              {#if $shiftStore.isClockedIn}
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span class="text-[10px] text-emerald-600 font-semibold">Sesi Aktif</span>
              {:else}
                <span class="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
                <span class="text-[10px] text-amber-600 font-semibold">Sesi Belum Dimulai</span>
              {/if}
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
