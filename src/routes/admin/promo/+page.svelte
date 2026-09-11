<script lang="ts">
  import { onMount } from 'svelte';
  import { Plus, Tag, X } from 'lucide-svelte';

  let promos: any[] = [];
  let showModal = false;
  let isSaving = false;
  let form = {
    code: '',
    title: '',
    value: '',
    minPurchase: 0
  };

  onMount(async () => {
    try {
      const res = await fetch('/api/promos').then(r => r.json());
      if (res?.success && Array.isArray(res.data)) {
        promos = res.data;
      }
    } catch (e) {
      console.warn('Failed to load promos from API', e);
    }
  });

  async function createPromo() {
    if (!form.code || !form.title || !form.value) {
      alert('Semua kolom wajib diisi!');
      return;
    }

    isSaving = true;
    try {
      const res = await fetch('/api/promos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: form.code,
          title: form.title,
          value: form.value,
          minPurchase: Number(form.minPurchase)
        })
      }).then(r => r.json());

      if (res?.success && res.data) {
        promos = [res.data, ...promos];
        showModal = false;
        form = { code: '', title: '', value: '', minPurchase: 0 };
      } else {
        alert('Gagal membuat promo: ' + (res?.message || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      isSaving = false;
    }
  }

  function formatRp(val: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-wide">Sistem Promo & Diskon Engine</h1>
      <p class="text-xs text-slate-500 mt-1">Pengaturan kupon diskon, minimal belanja & promo spesial toko</p>
    </div>

    <button on:click={() => showModal = true} class="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-md shadow-sky-600/20">
      <Plus class="w-4 h-4" />
      <span>BUAT PROMO BARU</span>
    </button>
  </div>

  <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
    <table class="w-full text-left text-xs text-slate-700">
      <thead class="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
        <tr>
          <th class="p-3">Kode Kupon</th>
          <th class="p-3">Judul Promo</th>
          <th class="p-3">Nilai Diskon</th>
          <th class="p-3 text-right">Min. Belanja</th>
          <th class="p-3 text-center">Status</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#each promos as pr}
          <tr class="hover:bg-slate-50">
            <td class="p-3 font-mono font-bold text-amber-600 flex items-center space-x-1">
              <Tag class="w-3.5 h-3.5" />
              <span>{pr.code}</span>
            </td>
            <td class="p-3 font-bold text-slate-900">{pr.title}</td>
            <td class="p-3 font-bold text-sky-700 font-mono">{pr.value}</td>
            <td class="p-3 text-right font-mono text-slate-500">{formatRp(pr.minPurchase)}</td>
            <td class="p-3 text-center">
              <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200">
                {pr.status}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

{#if showModal}
  <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
      <div class="flex justify-between items-center border-b border-slate-200 pb-3">
        <h3 class="text-base font-bold text-slate-900">Buat Promo Diskon Baru</h3>
        <button on:click={() => showModal = false} class="text-slate-400 hover:text-slate-700"><X class="w-5 h-5" /></button>
      </div>

      <div class="space-y-3 text-xs">
        <div>
          <label class="text-slate-600 font-bold">Kode Kupon Promo</label>
          <input type="text" bind:value={form.code} placeholder="Contoh: HEMAT10" class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1 font-mono uppercase" />
        </div>
        <div>
          <label class="text-slate-600 font-bold">Judul Deskripsi Promo</label>
          <input type="text" bind:value={form.title} placeholder="Contoh: Diskon Gajian 10%" class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1" />
        </div>
        <div>
          <label class="text-slate-600 font-bold">Nilai Diskon (Persen / Nominal)</label>
          <input type="text" bind:value={form.value} placeholder="Contoh: 10% atau Rp 5.000" class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1" />
        </div>
        <div>
          <label class="text-slate-600 font-bold">Minimal Belanja (Rp)</label>
          <input type="number" bind:value={form.minPurchase} placeholder="50000" class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1 font-mono" />
        </div>
      </div>

      <button on:click={createPromo} disabled={isSaving} class="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md shadow-sky-600/20">
        {isSaving ? 'MENYIMPAN...' : 'SIMPAN PROMO'}
      </button>
    </div>
  </div>
{/if}
