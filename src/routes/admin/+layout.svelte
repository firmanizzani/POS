<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore';
  import {
    LayoutDashboard,
    FileText,
    Package,
    Truck,
    ClipboardCheck,
    Users,
    Percent,
    Store,
    LogOut,
    UserCog,
    Menu,
    X
  } from 'lucide-svelte';

  const adminNav = [
    { href: '/admin', label: 'Dashboard Analitik', icon: LayoutDashboard },
    { href: '/admin/transaksi', label: 'Riwayat Transaksi', icon: FileText },
    { href: '/admin/produk', label: 'Master Produk', icon: Package },
    { href: '/admin/supplier', label: 'Supplier & PO', icon: Truck },
    { href: '/admin/stok-opname', label: 'Stock Opname', icon: ClipboardCheck },
    { href: '/admin/member', label: 'Member & Poin', icon: Users },
    { href: '/admin/promo', label: 'System Promo', icon: Percent },
    { href: '/admin/akun', label: 'Manajemen Akun', icon: UserCog }
  ];

  let isAuthReady = false;
  let isMobileMenuOpen = false;

  onMount(() => {
    const unsubscribe = authStore.subscribe((user) => {
      if (!user) {
        goto('/login');
      } else if (user.role !== 'admin') {
        goto('/kasir');
      } else {
        isAuthReady = true;
      }
    });
    return unsubscribe;
  });

  function logout() {
    authStore.logout();
    goto('/login');
  }
</script>

{#if isAuthReady}
<div class="min-h-screen flex flex-col bg-slate-100 text-slate-900 transition-opacity duration-200">
  <!-- Admin Top Header -->
  <header class="bg-white border-b border-slate-200 px-4 sm:px-6 py-3 flex items-center justify-between shadow-sm z-20">
    <div class="flex items-center space-x-3">
      <button on:click={() => isMobileMenuOpen = !isMobileMenuOpen} class="md:hidden p-1.5 text-slate-600 hover:bg-slate-100 rounded-lg">
        {#if isMobileMenuOpen}
          <X class="w-6 h-6" />
        {:else}
          <Menu class="w-6 h-6" />
        {/if}
      </button>
      <div class="bg-sky-600 p-2 rounded-xl text-white shadow-md shadow-sky-600/20">
        <Store class="w-5 h-5" />
      </div>
      <div>
        <h1 class="text-sm sm:text-base font-black text-slate-900 tracking-wide">ADMIN PANEL</h1>
        <p class="text-[10px] sm:text-[11px] text-sky-600 font-semibold">VecMart</p>
      </div>
    </div>

    <!-- Admin Session Info + Logout -->
    <div class="flex items-center space-x-2 sm:space-x-3">
      {#if $authStore}
        <div class="flex items-center space-x-2.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 sm:px-3 py-1.5">
          <div class="bg-amber-100 p-1 sm:p-1.5 rounded-lg">
            <UserCog class="w-4 h-4 text-amber-600" />
          </div>
          <div class="hidden sm:block">
            <p class="text-xs font-bold text-slate-900">{$authStore.name}</p>
            <span class="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Administrator</span>
          </div>
        </div>

        <button
          on:click={logout}
          class="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-colors flex items-center space-x-1 text-xs font-bold"
        >
          <LogOut class="w-4 h-4" />
          <span class="hidden sm:inline">Keluar</span>
        </button>
      {/if}
    </div>
  </header>

  <!-- Admin Content: Sidebar + Page -->
  <div class="flex-1 flex overflow-hidden relative">
    <!-- Mobile Backdrop -->
    {#if isMobileMenuOpen}
      <div on:click={() => isMobileMenuOpen = false} class="fixed inset-0 bg-slate-900/40 z-30 md:hidden backdrop-blur-xs"></div>
    {/if}

    <!-- Admin Sidebar -->
    <aside class="fixed md:static inset-y-0 left-0 z-40 w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shadow-lg md:shadow-sm transform transition-transform duration-200 ease-in-out {isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'} overflow-y-auto">
      <nav class="space-y-1">
        {#each adminNav as nav}
          <a
            href={nav.href}
            on:click={() => isMobileMenuOpen = false}
            class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all {$page.url.pathname === nav.href ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
          >
            <svelte:component this={nav.icon} class="w-4 h-4" />
            <span>{nav.label}</span>
          </a>
        {/each}
      </nav>
    </aside>

    <!-- Admin Main Content -->
    <main class="flex-1 overflow-y-auto p-3 sm:p-6 bg-slate-100 w-full min-w-0">
      <slot />
    </main>
  </div>
</div>
{/if}
