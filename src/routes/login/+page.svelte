<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import { authStore } from '$lib/stores/authStore';
  import { Store, Eye, EyeOff, Loader2, AlertCircle } from 'lucide-svelte';

  let email = '';
  let pinCode = '';
  let showPin = false;
  let isLoading = false;
  let errorMsg = '';

  onMount(() => {
    const unsubscribe = authStore.subscribe((user) => {
      if (user) {
        if (user.role === 'admin') {
          goto('/admin');
        } else {
          goto('/kasir');
        }
      }
    });
    return unsubscribe;
  });

  async function handleLogin() {
    errorMsg = '';
    if (!email || !pinCode) {
      errorMsg = 'Email dan PIN wajib diisi!';
      return;
    }

    isLoading = true;

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pinCode })
      }).then((r) => r.json());

      if (res?.success && res.user) {
        authStore.login({
          id: res.user.id,
          name: res.user.name,
          email: res.user.email,
          role: res.user.role,
          token: res.token || `token-${Date.now()}`
        });

        if (res.user.role === 'admin') {
          goto('/admin');
        } else {
          goto('/kasir');
        }
      } else {
        errorMsg = res?.message || 'Email atau PIN salah. Silakan coba lagi.';
      }
    } catch (e: any) {
      errorMsg = 'Gagal terhubung ke server: ' + e.message;
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="min-h-screen flex bg-slate-100">
  <!-- Left: Branding Panel -->
  <div class="hidden lg:flex w-1/2 bg-sky-700 flex-col justify-between p-12 relative overflow-hidden">
    <!-- Background pattern decorative circles -->
    <div class="absolute -top-20 -left-20 w-96 h-96 bg-sky-600 rounded-full opacity-50"></div>
    <div class="absolute -bottom-32 -right-16 w-96 h-96 bg-sky-800 rounded-full opacity-40"></div>

    <!-- Logo & Title -->
    <div class="relative z-10 flex items-center space-x-3">
      <div class="bg-white/20 p-3 rounded-2xl backdrop-blur-sm">
        <Store class="w-8 h-8 text-white" />
      </div>
      <div>
        <h1 class="text-2xl font-black text-white tracking-wide">POS MINIMARKET</h1>
        <p class="text-sky-200 text-sm font-medium">Sistem Kasir Professional</p>
      </div>
    </div>

    <!-- Footer -->
    <div class="relative z-10">
      <p class="text-sky-300 text-xs font-medium">© 2026 POS Minimarket Professional. All rights reserved.</p>
    </div>
  </div>

  <!-- Right: Login Form Panel -->
  <div class="flex-1 flex flex-col items-center justify-center p-6 sm:p-12">
    <div class="w-full max-w-md space-y-8">
      <!-- Mobile Logo -->
      <div class="flex items-center space-x-3 lg:hidden">
        <div class="bg-sky-600 p-2.5 rounded-xl shadow-md shadow-sky-600/20">
          <Store class="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 class="text-xl font-black text-slate-900">POS MINIMARKET</h1>
          <p class="text-sky-600 text-xs font-semibold">Sistem Kasir Professional</p>
        </div>
      </div>

      <!-- Form Header -->
      <div>
        <h2 class="text-3xl font-black text-slate-900">Selamat Datang</h2>
        <p class="text-slate-500 mt-1.5 text-sm font-medium">Masukkan email dan PIN untuk melanjutkan ke sistem kasir.</p>
      </div>

      <!-- Login Form -->
      <form on:submit|preventDefault={handleLogin} class="space-y-5">
        <!-- Email Field -->
        <div class="space-y-1.5">
          <label for="email" class="text-xs font-bold text-slate-700 uppercase tracking-wider">Email Akun</label>
          <input
            id="email"
            type="email"
            bind:value={email}
            placeholder="Contoh: kasir@minimarket.com"
            class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm transition-all placeholder:text-slate-400"
            autocomplete="email"
          />
        </div>

        <!-- PIN Field -->
        <div class="space-y-1.5">
          <label for="pin" class="text-xs font-bold text-slate-700 uppercase tracking-wider">PIN Kasir (6 Digit)</label>
          <div class="relative">
            <input
              id="pin"
              type={showPin ? 'text' : 'password'}
              bind:value={pinCode}
              placeholder="••••••"
              maxlength={6}
              class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-3 text-sm font-mono tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-sky-500 shadow-sm transition-all placeholder:tracking-normal placeholder:font-sans"
              autocomplete="current-password"
            />
            <button
              type="button"
              on:click={() => showPin = !showPin}
              class="absolute right-3.5 top-3.5 text-slate-400 hover:text-slate-600 transition-colors"
              tabindex="-1"
            >
              {#if showPin}
                <EyeOff class="w-4 h-4" />
              {:else}
                <Eye class="w-4 h-4" />
              {/if}
            </button>
          </div>
        </div>

        <!-- Error Message -->
        {#if errorMsg}
          <div class="flex items-center space-x-2.5 bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3">
            <AlertCircle class="w-4 h-4 shrink-0" />
            <span class="text-xs font-semibold">{errorMsg}</span>
          </div>
        {/if}

        <!-- Submit Button -->
        <button
          type="submit"
          disabled={isLoading}
          class="w-full py-3.5 bg-sky-600 hover:bg-sky-700 disabled:bg-sky-400 text-white font-black rounded-xl shadow-lg shadow-sky-600/25 transition-all flex items-center justify-center space-x-2 text-sm"
        >
          {#if isLoading}
            <Loader2 class="w-4 h-4 animate-spin" />
            <span>Memverifikasi...</span>
          {:else}
            <Store class="w-4 h-4" />
            <span>MASUK KE SISTEM POS</span>
          {/if}
        </button>
      </form>

      <!-- Demo Credentials Box -->
      <div class="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-3">
        <p class="text-xs font-bold text-amber-800 uppercase tracking-wider">🔑 Demo Akun Testing</p>
        <div class="space-y-2 text-xs font-mono">
          <div class="flex justify-between items-center bg-amber-100/80 px-3 py-2 rounded-xl">
            <div>
              <span class="font-bold text-amber-900 block">Admin</span>
              <span class="text-amber-700">admin@minimarket.com</span>
            </div>
            <span class="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-lg font-bold tracking-widest">123456</span>
          </div>
          <div class="flex justify-between items-center bg-amber-100/80 px-3 py-2 rounded-xl">
            <div>
              <span class="font-bold text-amber-900 block">Kasir 1</span>
              <span class="text-amber-700">ahmad@minimarket.com</span>
            </div>
            <span class="bg-amber-200 text-amber-900 px-2 py-0.5 rounded-lg font-bold tracking-widest">111111</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</div>
