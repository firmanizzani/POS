<script lang="ts">
  import { ClipboardCheck, Plus } from 'lucide-svelte';

  let adjustments = [
    { id: 'adj-1', productName: 'Aqua Air Mineral 600ml', reason: 'EXPIRED', qtyDiff: -5, adjustedBy: 'Admin Budi', date: '2026-09-09' },
    { id: 'adj-2', productName: 'Chitato Sapi Panggang 68g', reason: 'DAMAGED', qtyDiff: -2, adjustedBy: 'Admin Budi', date: '2026-09-10' }
  ];
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-wide">Stock Opname & Penyesuaian Stok</h1>
      <p class="text-xs text-slate-500 mt-1">Audit fisik toko, pencatatan barang rusak (Damaged) & kedaluwarsa (Expired)</p>
    </div>

    <button on:click={() => alert('Form Penyesuaian Stok Baru')} class="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-md shadow-sky-600/20">
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
