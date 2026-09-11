<script lang="ts">
  import { onMount } from 'svelte';
  import { Truck, Plus, FileText, CheckCircle, Clock, X } from 'lucide-svelte';

  let purchaseOrders: any[] = [];
  let showModal = false;
  let isSaving = false;
  let form = {
    supplierName: '',
    totalAmount: 0,
    notes: ''
  };

  onMount(async () => {
    try {
      const res = await fetch('/api/suppliers/po').then(r => r.json());
      if (res?.success && Array.isArray(res.data)) {
        purchaseOrders = res.data;
      }
    } catch (e) {
      console.warn('Failed to load purchase orders from API', e);
    }
  });

  async function createPO() {
    if (!form.supplierName || form.totalAmount <= 0) {
      alert('Nama Supplier & Total Tagihan wajib diisi!');
      return;
    }

    isSaving = true;
    try {
      const res = await fetch('/api/suppliers/po', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          supplierName: form.supplierName,
          totalAmount: Number(form.totalAmount),
          notes: form.notes
        })
      }).then(r => r.json());

      if (res?.success && res.data) {
        purchaseOrders = [res.data, ...purchaseOrders];
        showModal = false;
        form = { supplierName: '', totalAmount: 0, notes: '' };
      } else {
        alert('Gagal menyimpan PO: ' + (res?.message || 'Unknown error'));
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
      <h1 class="text-2xl font-bold text-slate-900 tracking-wide">Supplier & Purchase Orders (PO)</h1>
      <p class="text-xs text-slate-500 mt-1">Manajemen pemasok grosir dan pesanan barang (Stock In flow)</p>
    </div>

    <button on:click={() => showModal = true} class="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-md shadow-sky-600/20">
      <Plus class="w-4 h-4" />
      <span>BUAT PURCHASE ORDER (PO)</span>
    </button>
  </div>

  <!-- PO Table -->
  <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden p-5 space-y-4 shadow-sm">
    <h2 class="text-base font-bold text-slate-900 flex items-center space-x-2">
      <FileText class="w-5 h-5 text-sky-600" />
      <span>Daftar Purchase Order (PO)</span>
    </h2>

    <table class="w-full text-left text-xs text-slate-700">
      <thead class="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
        <tr>
          <th class="p-3">No. PO</th>
          <th class="p-3">Supplier</th>
          <th class="p-3">Tanggal</th>
          <th class="p-3 text-right">Total Tagihan</th>
          <th class="p-3 text-center">Status</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#each purchaseOrders as po}
          <tr class="hover:bg-slate-50">
            <td class="p-3 font-mono font-bold text-sky-700">{po.poNumber}</td>
            <td class="p-3 font-bold text-slate-900">{po.supplierName}</td>
            <td class="p-3 text-slate-500">{po.date}</td>
            <td class="p-3 text-right font-mono font-bold text-emerald-700">{formatRp(po.totalAmount)}</td>
            <td class="p-3 text-center">
              {#if po.status === 'RECEIVED'}
                <span class="px-2.5 py-1 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px] flex items-center justify-center space-x-1 w-24 mx-auto border border-emerald-200">
                  <CheckCircle class="w-3 h-3" />
                  <span>DITERIMA</span>
                </span>
              {:else}
                <span class="px-2.5 py-1 bg-amber-50 text-amber-700 rounded-full font-bold text-[10px] flex items-center justify-center space-x-1 w-24 mx-auto border border-amber-200">
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

{#if showModal}
  <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
      <div class="flex justify-between items-center border-b border-slate-200 pb-3">
        <h3 class="text-base font-bold text-slate-900">Buat Purchase Order Baru</h3>
        <button on:click={() => showModal = false} class="text-slate-400 hover:text-slate-700"><X class="w-5 h-5" /></button>
      </div>

      <div class="space-y-3 text-xs">
        <div>
          <label class="text-slate-600 font-bold">Nama Supplier / Grosir</label>
          <input type="text" bind:value={form.supplierName} placeholder="Contoh: PT Indofood Tbk" class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1" />
        </div>
        <div>
          <label class="text-slate-600 font-bold">Total Nilai Tagihan PO (Rp)</label>
          <input type="number" bind:value={form.totalAmount} placeholder="0" class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1" />
        </div>
      </div>

      <button on:click={createPO} disabled={isSaving} class="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md shadow-sky-600/20">
        {isSaving ? 'MENYIMPAN...' : 'SIMPAN PO'}
      </button>
    </div>
  </div>
{/if}
