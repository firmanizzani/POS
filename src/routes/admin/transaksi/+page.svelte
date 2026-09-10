<script lang="ts">
  import { FileText, Search, Printer, Download, Eye, Calendar, DollarSign, Filter, X } from 'lucide-svelte';

  let transactions = [
    {
      invoiceNumber: 'INV-20260910-001',
      date: '2026-09-10 19:42',
      cashierName: 'Ahmad Kasir',
      itemsCount: 3,
      subtotal: 10500,
      discount: 0,
      grandTotal: 10500,
      paidAmount: 20000,
      changeAmount: 9500,
      paymentMethod: 'CASH',
      items: [
        { name: 'Indomie Goreng Spesial 85g', qty: 2, price: 3500 },
        { name: 'Le Minerale 600ml', qty: 1, price: 3500 }
      ]
    },
    {
      invoiceNumber: 'INV-20260910-002',
      date: '2026-09-10 18:15',
      cashierName: 'Ahmad Kasir',
      itemsCount: 2,
      subtotal: 31500,
      discount: 3150,
      grandTotal: 28350,
      paidAmount: 28350,
      changeAmount: 0,
      paymentMethod: 'QRIS',
      items: [
        { name: 'Chitato Sapi Panggang 68g', qty: 1, price: 11500 },
        { name: 'Ultra Milk Full Cream 1000ml', qty: 1, price: 20000 }
      ]
    },
    {
      invoiceNumber: 'INV-20260909-088',
      date: '2026-09-09 14:20',
      cashierName: 'Budi (Admin)',
      itemsCount: 1,
      subtotal: 24000,
      discount: 0,
      grandTotal: 24000,
      paidAmount: 50000,
      changeAmount: 26000,
      paymentMethod: 'CASH',
      items: [
        { name: 'Rinso Anti Noda Deterjen Powder 770g', qty: 1, price: 24000 }
      ]
    }
  ];

  let searchQuery = '';
  let selectedMethod = 'ALL';
  let selectedTrx: any = null;
  let showDetailModal = false;

  $: filteredTransactions = transactions.filter((t) => {
    const matchQuery = t.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || t.cashierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMethod = selectedMethod === 'ALL' || t.paymentMethod === selectedMethod;
    return matchQuery && matchMethod;
  });

  function formatRp(val: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  }

  function downloadDigitalPDF(trx: any) {
    alert(`Mengunduh Struk Digital (PDF) untuk invoice ${trx.invoiceNumber}`);
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-wide">Riwayat Transaksi Penjualan</h1>
      <p class="text-xs text-slate-500 mt-1">Daftar lengkap struk penjualan, metode pembayaran, dan cetak ulang struk digital</p>
    </div>

    <button on:click={() => alert('Exporting all transactions report to Excel/PDF...')} class="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-2 shadow-sm">
      <Download class="w-4 h-4 text-sky-600" />
      <span>EXPORT ALL TRANSACTIONS</span>
    </button>
  </div>

  <!-- Filters & Search Bar -->
  <div class="flex items-center space-x-3 bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
    <div class="relative flex-1">
      <Search class="w-5 h-5 absolute left-3.5 top-2.5 text-slate-400" />
      <input
        type="text"
        bind:value={searchQuery}
        placeholder="Cari nomor invoice (INV-...) atau nama kasir..."
        class="w-full bg-slate-50 border border-slate-200 text-slate-900 text-xs rounded-xl pl-10 pr-4 py-2 focus:outline-none focus:border-sky-600"
      />
    </div>

    <div class="flex items-center space-x-2">
      <Filter class="w-4 h-4 text-slate-400 ml-1" />
      <select bind:value={selectedMethod} class="bg-slate-50 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl px-3 py-2 focus:outline-none">
        <option value="ALL">Semua Metode</option>
        <option value="CASH">TUNAI (CASH)</option>
        <option value="QRIS">QRIS</option>
        <option value="DEBIT">DEBIT</option>
      </select>
    </div>
  </div>

  <!-- Transaction History Table -->
  <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
    <table class="w-full text-left text-xs text-slate-700">
      <thead class="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
        <tr>
          <th class="p-3.5">No. Invoice</th>
          <th class="p-3.5">Waktu Transaksi</th>
          <th class="p-3.5">Kasir</th>
          <th class="p-3.5 text-center">Jumlah Item</th>
          <th class="p-3.5 text-center">Metode</th>
          <th class="p-3.5 text-right">Total Belanja</th>
          <th class="p-3.5 text-center">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#each filteredTransactions as t}
          <tr class="hover:bg-slate-50">
            <td class="p-3.5 font-mono font-bold text-sky-700 flex items-center space-x-1.5">
              <FileText class="w-4 h-4" />
              <span>{t.invoiceNumber}</span>
            </td>
            <td class="p-3.5 text-slate-500 font-mono">{t.date}</td>
            <td class="p-3.5 font-semibold text-slate-900">{t.cashierName}</td>
            <td class="p-3.5 text-center font-bold font-mono">{t.itemsCount} item</td>
            <td class="p-3.5 text-center">
              <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] {t.paymentMethod === 'QRIS' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
                {t.paymentMethod}
              </span>
            </td>
            <td class="p-3.5 text-right font-mono font-black text-slate-900">{formatRp(t.grandTotal)}</td>
            <td class="p-3.5 text-center space-x-1.5">
              <button
                on:click={() => {
                  selectedTrx = t;
                  showDetailModal = true;
                }}
                class="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-lg border border-slate-200"
              >
                <Eye class="w-3.5 h-3.5 inline mr-1" />
                <span>Detail</span>
              </button>
              <button
                on:click={() => downloadDigitalPDF(t)}
                class="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-lg border border-sky-200"
              >
                <Download class="w-3.5 h-3.5 inline mr-1" />
                <span>PDF</span>
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<!-- Modal Detail Struk Digital -->
{#if showDetailModal && selectedTrx}
  <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 rounded-3xl max-w-md w-full p-6 space-y-4 shadow-2xl">
      <div class="flex justify-between items-center border-b border-slate-200 pb-3">
        <h3 class="text-base font-bold text-slate-900">Detail Struk Digital</h3>
        <button on:click={() => showDetailModal = false} class="text-slate-400 hover:text-slate-700"><X class="w-5 h-5" /></button>
      </div>

      <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
        <div class="flex justify-between">
          <span class="text-slate-500">Invoice:</span>
          <span class="font-mono font-bold text-sky-700">{selectedTrx.invoiceNumber}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Kasir:</span>
          <span class="font-bold text-slate-900">{selectedTrx.cashierName}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Waktu:</span>
          <span class="font-mono text-slate-600">{selectedTrx.date}</span>
        </div>
        <div class="flex justify-between">
          <span class="text-slate-500">Metode Bayar:</span>
          <span class="font-bold text-emerald-700">{selectedTrx.paymentMethod}</span>
        </div>
      </div>

      <div class="space-y-2 border-t border-b border-slate-200 py-3 text-xs">
        <span class="font-bold text-slate-800 uppercase tracking-wider text-[10px]">Rincian Barang Belanjaan</span>
        {#each selectedTrx.items as item}
          <div class="flex justify-between text-slate-700">
            <span>{item.name} x{item.qty}</span>
            <span class="font-mono font-semibold">{formatRp(item.price * item.qty)}</span>
          </div>
        {/each}
      </div>

      <div class="space-y-1 text-xs text-slate-700 pt-1">
        <div class="flex justify-between font-black text-sm text-slate-900">
          <span>TOTAL TRANSAKSI</span>
          <span class="text-sky-700">{formatRp(selectedTrx.grandTotal)}</span>
        </div>
        <div class="flex justify-between text-slate-500">
          <span>Dibayar</span>
          <span>{formatRp(selectedTrx.paidAmount)}</span>
        </div>
        <div class="flex justify-between text-slate-500">
          <span>Kembalian</span>
          <span>{formatRp(selectedTrx.changeAmount)}</span>
        </div>
      </div>

      <div class="grid grid-cols-2 gap-2 pt-2">
        <button on:click={() => downloadDigitalPDF(selectedTrx)} class="py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md shadow-sky-600/20">
          <Download class="w-4 h-4" />
          <span>UNDUH PDF</span>
        </button>
        <button on:click={() => window.print()} class="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center space-x-1 border border-slate-200">
          <Printer class="w-4 h-4" />
          <span>CETAK ulang</span>
        </button>
      </div>
    </div>
  </div>
{/if}
