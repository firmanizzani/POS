<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { Store, ShoppingCart, LayoutDashboard, Package, Truck, ClipboardList, Users, Percent, LogOut } from 'lucide-svelte';
</script>

<div class="min-h-screen flex flex-col bg-slate-900 text-slate-100">
  <!-- Top Navigation Header -->
  <header class="bg-slate-950 border-b border-slate-800 px-6 py-3 flex items-center justify-between shadow-md">
    <div class="flex items-center space-x-3">
      <div class="bg-sky-500 p-2 rounded-lg text-white font-bold">
        <Store class="w-6 h-6" />
      </div>
      <div>
        <h1 class="text-lg font-bold text-white tracking-wide">POS MINIMARKET</h1>
        <p class="text-xs text-sky-400 font-medium">Sistem Kasir & Manajemen Toko Professional</p>
      </div>
    </div>

    <!-- Navigation Switcher -->
    <nav class="flex items-center space-x-2 bg-slate-900 p-1.5 rounded-xl border border-slate-800">
      <a
        href="/kasir"
        class="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all {$page.url.pathname.startsWith('/kasir') ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}"
      >
        <ShoppingCart class="w-4 h-4" />
        <span>KASIR (POS)</span>
      </a>
      <a
        href="/admin"
        class="flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all {$page.url.pathname.startsWith('/admin') ? 'bg-sky-600 text-white shadow-lg' : 'text-slate-400 hover:text-slate-200'}"
      >
        <LayoutDashboard class="w-4 h-4" />
        <span>ADMIN DASHBOARD</span>
      </a>
    </nav>

    <!-- Cashier Info & Status -->
    <div class="flex items-center space-x-4">
      <div class="text-right">
        <p class="text-sm font-semibold text-slate-200">Ahmad (Kasir 1)</p>
        <div class="flex items-center justify-end space-x-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-xs text-emerald-400 font-medium">Shift Aktif</span>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Workspace Area -->
  <main class="flex-1 flex flex-col overflow-hidden bg-slate-950">
    <slot />
  </main>
</div>
