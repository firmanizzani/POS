<script lang="ts">
  import { ClipboardCheck, Plus, AlertCircle, RefreshCw } from 'lucide-svelte';

  let adjustments = [
    { id: 'adj-1', productName: 'Air Mineral Aqua 600ml', reason: 'EXPIRED', qtyDiff: -5, adjustedBy: 'Admin Budi', date: '2026-09-09' },
    { id: 'adj-2', productName: 'Chitato Sapi Panggang 68g', reason: 'DAMAGED', qtyDiff: -2, adjustedBy: 'Admin Budi', date: '2026-09-10' }
  ];
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-white tracking-wide">Stock Opname & Penyesuaian Stok</h1>
      <p class="text-xs text-slate-400 mt-1">Audit fisik toko, pencatatan barang rusak (Damaged) & kedaluwarsa (Expired)</p>
    </div>

    <button on:click={() => alert('Form Penyesuaian Stok Baru')} class="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2">
      <Plus class="w-4 h-4" />
      <span>INPUT STOCK ADJUSTMENT</span>
    </button>
  </div>

  <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
    <h2 class="text-base font-bold text-white flex items-center space-x-2">
      <ClipboardCheck class="w-5 h-5 text-amber-400" />
      <span>Riwayat Penyesuaian Stok</span>
    </h2>

    <table class="w-full text-left text-xs text-slate-300">
      <thead class="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
        <tr>
          <th class="p-3">Produk</th>
          <th class="p-3">Alasan (Reason)</th>
          <th class="p-3 text-center">Selisih Stok</th>
          <th class="p-3">Disesuaikan Oleh</th>
          <th class="p-3 text-right">Tanggal</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800">
        {#each adjustments as adj}
          <tr class="hover:bg-slate-800/40">
            <td class="p-3 font-semibold text-white">{adj.productName}</td>
            <td class="p-3">
              <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] {adj.reason === 'EXPIRED' ? 'bg-red-500/20 text-red-400' : 'bg-amber-500/20 text-amber-400'}">
                {adj.reason}
              </span>
            </td>
            <td class="p-3 text-center font-mono font-bold text-red-400">{adj.qtyDiff} pcs</td>
            <td class="p-3 text-slate-300">{adj.adjustedBy}</td>
            <td class="p-3 text-right text-slate-400 font-mono">{adj.date}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
