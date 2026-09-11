<script lang="ts">
  import { onMount } from 'svelte';
  import { ClipboardCheck, Plus, X } from 'lucide-svelte';

  let adjustments: any[] = [];
  let showModal = false;
  let isSaving = false;
  let form = {
    productName: '',
    reason: 'DAMAGED',
    qtyDiff: -1
  };

  onMount(async () => {
    try {
      const res = await fetch('/api/stock-adjustments').then(r => r.json());
      if (res?.success && Array.isArray(res.data)) {
        adjustments = res.data;
      }
    } catch (e) {
      console.warn('Failed to load stock adjustments from API', e);
    }
  });

  async function createAdjustment() {
    if (!form.productName) {
      alert('Nama produk wajib diisi!');
      return;
    }

    isSaving = true;
    try {
      const res = await fetch('/api/stock-adjustments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productName: form.productName,
          reason: form.reason,
          qtyDiff: Number(form.qtyDiff)
        })
      }).then(r => r.json());

      if (res?.success && res.data) {
        adjustments = [res.data, ...adjustments];
        showModal = false;
        form = { productName: '', reason: 'DAMAGED', qtyDiff: -1 };
      } else {
        alert('Gagal menyimpan penyesuaian: ' + (res?.message || 'Unknown error'));
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      isSaving = false;
    }
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-wide">Stock Opname & Penyesuaian Stok</h1>
      <p class="text-xs text-slate-500 mt-1">Audit fisik toko, pencatatan barang rusak (Damaged) & kedaluwarsa (Expired)</p>
    </div>

    <button on:click={() => showModal = true} class="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-md shadow-sky-600/20">
      <Plus class="w-4 h-4" />
      <span>INPUT STOCK ADJUSTMENT</span>
    </button>
  </div>

  <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
    <h2 class="text-base font-bold text-slate-900 flex items-center space-x-2">
      <ClipboardCheck class="w-5 h-5 text-amber-600" />
      <span>Riwayat Penyesuaian Stok</span>
    </h2>

    <table class="w-full text-left text-xs text-slate-700">
      <thead class="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
        <tr>
          <th class="p-3">Produk</th>
          <th class="p-3">Alasan (Reason)</th>
          <th class="p-3 text-center">Selisih Stok</th>
          <th class="p-3">Disesuaikan Oleh</th>
          <th class="p-3 text-right">Tanggal</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#each adjustments as adj}
          <tr class="hover:bg-slate-50">
            <td class="p-3 font-bold text-slate-900">{adj.productName}</td>
            <td class="p-3">
              <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] {adj.reason === 'EXPIRED' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}">
                {adj.reason}
              </span>
            </td>
            <td class="p-3 text-center font-mono font-bold text-red-600">{adj.qtyDiff} pcs</td>
            <td class="p-3 text-slate-700">{adj.adjustedBy}</td>
            <td class="p-3 text-right text-slate-500 font-mono">{adj.date}</td>
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
        <h3 class="text-base font-bold text-slate-900">Input Penyesuaian Stok</h3>
        <button on:click={() => showModal = false} class="text-slate-400 hover:text-slate-700"><X class="w-5 h-5" /></button>
      </div>

      <div class="space-y-3 text-xs">
        <div>
          <label class="text-slate-600 font-bold">Nama Produk</label>
          <input type="text" bind:value={form.productName} placeholder="Contoh: Indomie Goreng" class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1" />
        </div>
        <div>
          <label class="text-slate-600 font-bold">Alasan Penyesuaian</label>
          <select bind:value={form.reason} class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1">
            <option value="DAMAGED">Rusak / Bocor (Damaged)</option>
            <option value="EXPIRED">Kedaluwarsa (Expired)</option>
            <option value="LOST">Hilang (Lost)</option>
          </select>
        </div>
        <div>
          <label class="text-slate-600 font-bold">Jumlah Selisih (Negatif untuk berkurang)</label>
          <input type="number" bind:value={form.qtyDiff} placeholder="-1" class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1 font-mono" />
        </div>
      </div>

      <button on:click={createAdjustment} disabled={isSaving} class="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md shadow-sky-600/20">
        {isSaving ? 'MENYIMPAN...' : 'SIMPAN STOK OPNAME'}
      </button>
    </div>
  </div>
{/if}
