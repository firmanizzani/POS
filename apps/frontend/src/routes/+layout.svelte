<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { Store, ShoppingCart, LayoutDashboard } from 'lucide-svelte';
</script>

<div class="min-h-screen flex flex-col bg-slate-100 text-slate-900">
  <!-- Top Navigation Header Light Theme -->
  <header class="bg-white border-b border-slate-200 px-6 py-3 flex items-center justify-between shadow-sm">
    <div class="flex items-center space-x-3">
      <div class="bg-sky-600 p-2 rounded-xl text-white font-bold shadow-md shadow-sky-600/20">
        <Store class="w-6 h-6" />
      </div>
      <div>
        <h1 class="text-lg font-bold text-slate-900 tracking-wide">POS MINIMARKET</h1>
        <p class="text-xs text-sky-600 font-semibold">Sistem Kasir & Manajemen Toko Professional</p>
      </div>
    </div>

    <!-- Navigation Switcher -->
    <nav class="flex items-center space-x-2 bg-slate-100 p-1.5 rounded-2xl border border-slate-200">
      <a
        href="/kasir"
        class="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all {$page.url.pathname.startsWith('/kasir') ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}"
      >
        <ShoppingCart class="w-4 h-4" />
        <span>KASIR (POS)</span>
      </a>
      <a
        href="/admin"
        class="flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-semibold transition-all {$page.url.pathname.startsWith('/admin') ? 'bg-sky-600 text-white shadow-md' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'}"
      >
        <LayoutDashboard class="w-4 h-4" />
        <span>ADMIN DASHBOARD</span>
      </a>
    </nav>

    <!-- Cashier Info & Status -->
    <div class="flex items-center space-x-4">
      <div class="text-right">
        <p class="text-sm font-bold text-slate-800">Ahmad (Kasir 1)</p>
        <div class="flex items-center justify-end space-x-1.5">
          <span class="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          <span class="text-xs text-emerald-600 font-semibold">Shift Aktif</span>
        </div>
      </div>
    </div>
  </header>

  <!-- Main Workspace Area -->
  <main class="flex-1 flex flex-col overflow-hidden bg-slate-100">
    <slot />
  </main>
</div>
