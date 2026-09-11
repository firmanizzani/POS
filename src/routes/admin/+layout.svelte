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
    UserCog
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

  onMount(() => {
    const unsubscribe = authStore.subscribe((user) => {
      if (!user) {
        goto('/login');
      } else if (user.role !== 'admin') {
        // Cashier trying to access admin — block and redirect
        goto('/kasir');
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
  <!-- Admin Top Header -->
  <header class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm z-10">
    <div class="flex items-center space-x-3">
      <div class="bg-sky-600 p-2 rounded-xl text-white shadow-md shadow-sky-600/20">
        <Store class="w-5 h-5" />
      </div>
      <div>
        <h1 class="text-base font-black text-slate-900 tracking-wide">ADMIN PANEL</h1>
        <p class="text-[11px] text-sky-600 font-semibold">PopMart</p>
      </div>
    </div>

    <!-- Admin Session Info + Logout -->
    <div class="flex items-center space-x-3">
      {#if $authStore}
        <div class="flex items-center space-x-3 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
          <div class="bg-amber-100 p-1.5 rounded-lg">
            <UserCog class="w-4 h-4 text-amber-600" />
          </div>
          <div>
            <p class="text-xs font-bold text-slate-900">{$authStore.name}</p>
            <span class="text-[10px] text-amber-600 font-bold uppercase tracking-wider">Administrator</span>
          </div>
        </div>

        <button
          on:click={logout}
          class="p-2 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl border border-red-200 transition-colors flex items-center space-x-1 text-xs font-bold"
        >
          <LogOut class="w-4 h-4" />
          <span>Keluar</span>
        </button>
      {/if}
    </div>
  </header>

  <!-- Admin Content: Sidebar + Page -->
  <div class="flex-1 flex overflow-hidden">
    <!-- Admin Sidebar -->
    <aside class="w-64 bg-white border-r border-slate-200 p-4 flex flex-col justify-between shadow-sm overflow-y-auto">
      <nav class="space-y-1">
        {#each adminNav as nav}
          <a
            href={nav.href}
            class="flex items-center space-x-3 px-3.5 py-2.5 rounded-xl text-sm font-semibold transition-all {$page.url.pathname === nav.href ? 'bg-sky-50 text-sky-700 border border-sky-200 shadow-sm' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'}"
          >
            <svelte:component this={nav.icon} class="w-4 h-4" />
            <span>{nav.label}</span>
          </a>
        {/each}
      </nav>
    </aside>

    <!-- Admin Main Content -->
    <main class="flex-1 overflow-y-auto p-6 bg-slate-100">
      <slot />
    </main>
  </div>
</div>
