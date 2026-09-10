<script lang="ts">
  import { Truck, Plus, FileText, CheckCircle, Clock } from 'lucide-svelte';

  let suppliers = [
    { id: 'sup-1', name: 'PT Indofood Sukses Makmur', phone: '021-57958888', email: 'sales@indofood.co.id', address: 'Sudirman Plaza, Jakarta' },
    { id: 'sup-2', name: 'PT Mayora Indah Tbk', phone: '021-80637000', email: 'order@mayora.co.id', address: 'Daan Mogot, Jakarta' }
  ];

  let purchaseOrders = [
    { poNumber: 'PO-202609-001', supplierName: 'PT Indofood Sukses Makmur', totalAmount: 4500000, status: 'RECEIVED', date: '2026-09-08' },
    { poNumber: 'PO-202609-002', supplierName: 'PT Mayora Indah Tbk', totalAmount: 2800000, status: 'PENDING', date: '2026-09-10' }
  ];

  function formatRp(val: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-white tracking-wide">Supplier & Purchase Orders (PO)</h1>
      <p class="text-xs text-slate-400 mt-1">Manajemen pemasok grosir dan pesanan barang (Stock In flow)</p>
    </div>

    <button on:click={() => alert('Form Purchase Order Baru')} class="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2">
      <Plus class="w-4 h-4" />
      <span>BUAT PURCHASE ORDER (PO)</span>
    </button>
  </div>

  <!-- PO Table -->
  <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden p-5 space-y-4">
    <h2 class="text-base font-bold text-white flex items-center space-x-2">
      <FileText class="w-5 h-5 text-sky-400" />
      <span>Daftar Purchase Order (PO)</span>
    </h2>

    <table class="w-full text-left text-xs text-slate-300">
      <thead class="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
        <tr>
          <th class="p-3">No. PO</th>
          <th class="p-3">Supplier</th>
          <th class="p-3">Tanggal</th>
          <th class="p-3 text-right">Total Tagihan</th>
          <th class="p-3 text-center">Status</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800">
        {#each purchaseOrders as po}
          <tr class="hover:bg-slate-800/40">
            <td class="p-3 font-mono font-bold text-sky-400">{po.poNumber}</td>
            <td class="p-3 font-semibold text-white">{po.supplierName}</td>
            <td class="p-3 text-slate-400">{po.date}</td>
            <td class="p-3 text-right font-mono font-bold text-emerald-400">{formatRp(po.totalAmount)}</td>
            <td class="p-3 text-center">
              {#if po.status === 'RECEIVED'}
                <span class="px-2.5 py-1 bg-emerald-500/20 text-emerald-400 rounded-full font-bold text-[10px] flex items-center justify-center space-x-1 w-24 mx-auto">
                  <CheckCircle class="w-3 h-3" />
                  <span>DITERIMA</span>
                </span>
              {:else}
                <span class="px-2.5 py-1 bg-amber-500/20 text-amber-400 rounded-full font-bold text-[10px] flex items-center justify-center space-x-1 w-24 mx-auto">
                  <Clock class="w-3 h-3" />
                  <span>PENDING</span>
                </span>
              {/if}
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
