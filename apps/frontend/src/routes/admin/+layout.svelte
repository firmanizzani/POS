<script lang="ts">
  import { page } from '$app/stores';
  import {
    LayoutDashboard,
    Package,
    Truck,
    ClipboardCheck,
    Users,
    Percent
  } from 'lucide-svelte';

  const adminNav = [
    { href: '/admin', label: 'Dashboard Analitik', icon: LayoutDashboard },
    { href: '/admin/produk', label: 'Master Produk', icon: Package },
    { href: '/admin/supplier', label: 'Supplier & PO', icon: Truck },
    { href: '/admin/stok-opname', label: 'Stock Opname', icon: ClipboardCheck },
    { href: '/admin/member', label: 'Member & Poin', icon: Users },
    { href: '/admin/promo', label: 'System Promo', icon: Percent }
  ];
</script>

<div class="flex-1 flex overflow-hidden bg-slate-100">
  <!-- Admin Sidebar Light Theme -->
  <aside class="w-64 bg-white border-r border-slate-200 p-4 space-y-4 flex flex-col justify-between shadow-sm">
    <div class="space-y-6">
      <div class="px-2">
        <h2 class="text-xs font-bold text-slate-400 uppercase tracking-wider">MODUL ADMIN & MANAGER</h2>
        <p class="text-[11px] text-slate-500 mt-0.5">Pengelolaan minimarket terpusat</p>
      </div>

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
    </div>

    <!-- System Status Footer -->
    <div class="bg-slate-50 border border-slate-200 p-3 rounded-2xl space-y-2 text-xs">
      <div class="flex items-center justify-between">
        <span class="text-slate-500">Database API:</span>
        <span class="text-emerald-700 font-bold">PostgreSQL</span>
      </div>
      <div class="flex items-center justify-between">
        <span class="text-slate-500">Backend Server:</span>
        <span class="text-sky-700 font-bold">Elysia.js</span>
      </div>
    </div>
  </aside>

  <!-- Admin Main Content -->
  <div class="flex-1 overflow-y-auto p-6 bg-slate-100">
    <slot />
  </div>
</div>
