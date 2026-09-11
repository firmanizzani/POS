<script lang="ts">
  import { onMount } from 'svelte';
  import { UserCog, Plus, Edit3, Trash2, X, Eye, EyeOff, ShieldCheck, User } from 'lucide-svelte';
  import { authStore } from '$lib/stores/authStore';

  interface Account {
    id: string;
    name: string;
    email: string;
    pinCode: string;
    role: 'admin' | 'cashier';
    createdAt: string;
  }

  let accounts: Account[] = [];
  let showModal = false;
  let showPin = false;
  let editingId: string | null = null;
  let isSaving = false;

  let form = {
    name: '',
    email: '',
    pinCode: '',
    role: 'cashier' as 'admin' | 'cashier'
  };

  let formError = '';

  onMount(async () => {
    try {
      const res = await fetch('/api/users').then(r => r.json());
      if (res?.success && Array.isArray(res.data)) {
        accounts = res.data;
      }
    } catch (e) {
      console.warn('Failed to load users from API', e);
    }
  });

  function openCreate() {
    editingId = null;
    form = { name: '', email: '', pinCode: '', role: 'cashier' };
    formError = '';
    showModal = true;
  }

  function openEdit(acc: Account) {
    editingId = acc.id;
    form = { name: acc.name, email: acc.email, pinCode: acc.pinCode, role: acc.role };
    formError = '';
    showModal = true;
  }

  async function saveAccount() {
    formError = '';
    if (!form.name || !form.email || !form.pinCode) {
      formError = 'Nama, email, dan PIN wajib diisi!';
      return;
    }
    if (form.pinCode.length !== 6 || !/^\d{6}$/.test(form.pinCode)) {
      formError = 'PIN harus tepat 6 digit angka!';
      return;
    }

    const emailExists = accounts.some((a) => a.email === form.email && a.id !== editingId);
    if (emailExists) {
      formError = 'Email sudah digunakan oleh akun lain!';
      return;
    }

    isSaving = true;
    try {
      if (editingId) {
        const res = await fetch(`/api/users/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        }).then(r => r.json());

        if (res?.success) {
          accounts = accounts.map((a) => (a.id === editingId ? { ...a, ...form } : a));
          showModal = false;
        } else {
          formError = res?.message || 'Gagal memperbarui akun';
        }
      } else {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(form)
        }).then(r => r.json());

        if (res?.success && res.data) {
          accounts = [...accounts, res.data];
          showModal = false;
        } else {
          formError = res?.message || 'Gagal membuat akun';
        }
      }
    } catch (e: any) {
      formError = 'Error: ' + e.message;
    } finally {
      isSaving = false;
    }
  }

  async function deleteAccount(id: string) {
    // Prevent deleting own account
    if ($authStore?.id === id) {
      alert('Anda tidak dapat menghapus akun Anda sendiri!');
      return;
    }
    if (confirm('Yakin ingin menghapus akun ini? Tindakan ini tidak dapat dibatalkan.')) {
      try {
        const res = await fetch(`/api/users/${id}`, { method: 'DELETE' }).then(r => r.json());
        if (res?.success) {
          accounts = accounts.filter((a) => a.id !== id);
        } else {
          alert('Gagal menghapus akun: ' + res?.message);
        }
      } catch (e: any) {
        alert('Error hapus akun: ' + e.message);
      }
    }
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-wide">Manajemen Akun Pengguna</h1>
      <p class="text-xs text-slate-500 mt-1">Buat, edit, dan kelola akun kasir & admin. Hanya Admin yang dapat mengakses halaman ini.</p>
    </div>

    <button
      on:click={openCreate}
      class="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-md shadow-sky-600/20"
    >
      <Plus class="w-4 h-4" />
      <span>BUAT AKUN BARU</span>
    </button>
  </div>

  <!-- Stats Cards -->
  <div class="grid grid-cols-3 gap-4">
    <div class="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
      <span class="text-xs font-bold text-slate-500 uppercase">Total Akun</span>
      <div class="text-2xl font-black text-slate-900 mt-1">{accounts.length}</div>
    </div>
    <div class="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
      <span class="text-xs font-bold text-slate-500 uppercase">Akun Admin</span>
      <div class="text-2xl font-black text-amber-600 mt-1">{accounts.filter((a) => a.role === 'admin').length}</div>
    </div>
    <div class="bg-white border border-slate-200 p-4 rounded-2xl shadow-sm">
      <span class="text-xs font-bold text-slate-500 uppercase">Akun Kasir</span>
      <div class="text-2xl font-black text-sky-600 mt-1">{accounts.filter((a) => a.role === 'cashier').length}</div>
    </div>
  </div>

  <!-- Accounts Table -->
  <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
    <table class="w-full text-left text-xs text-slate-700">
      <thead class="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
        <tr>
          <th class="p-3.5">Nama Pengguna</th>
          <th class="p-3.5">Email</th>
          <th class="p-3.5 text-center">Role / Jabatan</th>
          <th class="p-3.5 text-center">Tgl Dibuat</th>
          <th class="p-3.5 text-center">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#each accounts as acc}
          <tr class="hover:bg-slate-50">
            <!-- Name with Role Icon -->
            <td class="p-3.5">
              <div class="flex items-center space-x-2.5">
                <div class="p-2 rounded-xl {acc.role === 'admin' ? 'bg-amber-100' : 'bg-sky-100'}">
                  {#if acc.role === 'admin'}
                    <ShieldCheck class="w-4 h-4 text-amber-600" />
                  {:else}
                    <User class="w-4 h-4 text-sky-600" />
                  {/if}
                </div>
                <div>
                  <p class="font-bold text-slate-900">{acc.name}</p>
                  {#if $authStore?.id === acc.id}
                    <span class="text-[10px] text-emerald-600 font-semibold">(Anda)</span>
                  {/if}
                </div>
              </div>
            </td>
            <td class="p-3.5 font-mono text-slate-600">{acc.email}</td>
            <td class="p-3.5 text-center">
              <span class="px-2.5 py-1 rounded-full font-bold text-[10px] {acc.role === 'admin' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-sky-50 text-sky-700 border border-sky-200'}">
                {acc.role === 'admin' ? '🛡️ Admin' : '🏪 Kasir'}
              </span>
            </td>
            <td class="p-3.5 text-center text-slate-400 font-mono">{acc.createdAt}</td>
            <td class="p-3.5 text-center space-x-1.5">
              <button
                on:click={() => openEdit(acc)}
                class="p-1.5 bg-slate-100 hover:bg-slate-200 text-sky-700 rounded-lg border border-slate-200"
                title="Edit Akun"
              >
                <Edit3 class="w-4 h-4" />
              </button>
              <button
                on:click={() => deleteAccount(acc.id)}
                disabled={$authStore?.id === acc.id}
                class="p-1.5 bg-slate-100 hover:bg-slate-200 text-red-600 rounded-lg border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed"
                title="Hapus Akun"
              >
                <Trash2 class="w-4 h-4" />
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<!-- Modal Form Create/Edit Akun -->
{#if showModal}
  <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-5 shadow-2xl">
      <div class="flex justify-between items-center border-b border-slate-200 pb-3">
        <h3 class="text-base font-bold text-slate-900 flex items-center space-x-2">
          <UserCog class="w-5 h-5 text-sky-600" />
          <span>{editingId ? 'Edit Akun Pengguna' : 'Buat Akun Baru'}</span>
        </h3>
        <button on:click={() => showModal = false} class="text-slate-400 hover:text-slate-700">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="space-y-4 text-xs">
        <!-- Name -->
        <div class="space-y-1.5">
          <label class="font-bold text-slate-700 uppercase tracking-wider">Nama Lengkap</label>
          <input
            type="text"
            bind:value={form.name}
            placeholder="Nama kasir atau admin"
            class="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 text-sm"
          />
        </div>

        <!-- Email -->
        <div class="space-y-1.5">
          <label class="font-bold text-slate-700 uppercase tracking-wider">Email Login</label>
          <input
            type="email"
            bind:value={form.email}
            placeholder="contoh@minimarket.com"
            class="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 font-mono text-sm"
          />
        </div>

        <!-- PIN -->
        <div class="space-y-1.5">
          <label class="font-bold text-slate-700 uppercase tracking-wider">PIN Kasir (6 Digit)</label>
          <div class="relative">
            <input
              type={showPin ? 'text' : 'password'}
              bind:value={form.pinCode}
              placeholder="6 digit angka"
              maxlength={6}
              class="w-full bg-slate-50 border border-slate-300 text-slate-900 rounded-xl px-3.5 py-2.5 font-mono tracking-widest focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 text-sm"
            />
            <button
              type="button"
              on:click={() => showPin = !showPin}
              class="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600"
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

        <!-- Role -->
        <div class="space-y-1.5">
          <label class="font-bold text-slate-700 uppercase tracking-wider">Role / Jabatan</label>
          <div class="grid grid-cols-2 gap-2">
            <button
              type="button"
              on:click={() => form.role = 'cashier'}
              class="py-3 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition-all {form.role === 'cashier' ? 'bg-sky-50 border-sky-400 text-sky-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500'}"
            >
              <User class="w-5 h-5" />
              <span>🏪 Kasir</span>
            </button>
            <button
              type="button"
              on:click={() => form.role = 'admin'}
              class="py-3 rounded-xl border text-xs font-bold flex flex-col items-center space-y-1 transition-all {form.role === 'admin' ? 'bg-amber-50 border-amber-400 text-amber-700 shadow-sm' : 'bg-slate-50 border-slate-200 text-slate-500'}"
            >
              <ShieldCheck class="w-5 h-5" />
              <span>🛡️ Admin</span>
            </button>
          </div>
        </div>

        <!-- Error Message -->
        {#if formError}
          <div class="bg-red-50 border border-red-200 text-red-700 rounded-xl px-3.5 py-2.5 text-xs font-semibold">
            ⚠️ {formError}
          </div>
        {/if}
      </div>

      <button
        on:click={saveAccount}
        disabled={isSaving}
        class="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-black rounded-xl text-xs uppercase tracking-wider shadow-md shadow-sky-600/20"
      >
        {isSaving ? 'MENYIMPAN...' : (editingId ? 'SIMPAN PERUBAHAN AKUN' : 'BUAT AKUN SEKARANG')}
      </button>
    </div>
  </div>
{/if}
