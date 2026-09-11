<script lang="ts">
  import { onMount } from 'svelte';
  import { FileText, Search, Printer, Download, Eye, Filter, X, Clock, CheckCircle, AlertTriangle, Wallet } from 'lucide-svelte';

  let activeTab: 'transactions' | 'shifts' = 'transactions';
  let transactions: any[] = [];
  let shifts: any[] = [];
  let searchQuery = '';
  let selectedMethod = 'ALL';
  let selectedTrx: any = null;
  let showDetailModal = false;

  onMount(async () => {
    try {
      const res = await fetch('/api/transactions').then(r => r.json());
      if (res?.success && Array.isArray(res.data)) {
        transactions = res.data;
      }
    } catch (e) {
      console.warn('Failed to load transactions from API', e);
    }

    try {
      const resS = await fetch('/api/cashier/shifts').then(r => r.json());
      if (resS?.success && Array.isArray(resS.data)) {
        shifts = resS.data;
      }
    } catch (e) {
      console.warn('Failed to load shifts', e);
    }
  });

  $: filteredTransactions = transactions.filter((t) => {
    const matchQuery = t.invoiceNumber.toLowerCase().includes(searchQuery.toLowerCase()) || t.cashierName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchMethod = selectedMethod === 'ALL' || t.paymentMethod === selectedMethod;
    return matchQuery && matchMethod;
  });

  function formatRp(val: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  }

  async function exportAllTransactionsXLSX() {
    const XLSX = await import('xlsx');
    const today = new Date().toISOString().slice(0, 10);
    const headers = [
      'No. Invoice',
      'Waktu Transaksi',
      'Kasir',
      'Jumlah Item',
      'Metode Pembayaran',
      'Subtotal (Rp)',
      'Diskon (Rp)',
      'Grand Total (Rp)',
      'Dibayar (Rp)',
      'Kembalian (Rp)',
      'Rincian Barang Belanjaan'
    ];

    const dataRows = filteredTransactions.map(t => [
      t.invoiceNumber,
      t.date,
      t.cashierName,
      t.itemsCount,
      t.paymentMethod,
      t.subtotal || t.grandTotal,
      t.discount || 0,
      t.grandTotal,
      t.paidAmount,
      t.changeAmount,
      (t.items || []).map((i: any) => `${i.name} (${i.qty}x @ Rp${i.price.toLocaleString('id-ID')})`).join(' | ')
    ]);

    const rows = [
      ['LAPORAN RIWAYAT TRANSAKSI PENJUALAN MINIMARKET'],
      [`Tanggal Ekspor: ${today}`],
      [`Total Transaksi Terfilter: ${filteredTransactions.length}`],
      [],
      headers,
      ...dataRows
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);

    // Hitung lebar kolom otomatis berdasarkan konten terpanjang
    const colWidths: number[] = [];
    rows.forEach(row => {
      row.forEach((cell: any, colIdx: number) => {
        const len = String(cell ?? '').length;
        colWidths[colIdx] = Math.max(colWidths[colIdx] ?? 10, len + 2);
      });
    });
    ws['!cols'] = colWidths.map(w => ({ wch: Math.min(w, 60) }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Riwayat Transaksi');
    XLSX.writeFile(wb, `Laporan_Transaksi_Penjualan_${today}.xlsx`);
  }

  function printDigitalReceipt(trx: any) {
    const printWin = window.open('', '_blank', 'width=400,height=600');
    if (!printWin) return;

    const items = (trx.items || [])
      .map((i: any) => `<div style="display:flex;justify-content:space-between;margin:4px 0;"><span>${i.name} x${i.qty}</span><span>${formatRp(i.price * i.qty)}</span></div>`)
      .join('');

    printWin.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Struk Digital ${trx.invoiceNumber}</title>
          <style>
            body { font-family: monospace; padding: 20px; width: 300px; margin: 0 auto; color: #1e293b; }
            h2 { text-align: center; margin: 0 0 5px; font-size: 16px; }
            p { text-align: center; margin: 0 0 15px; font-size: 10px; color: #64748b; }
            .line { border-top: 1px dashed #cbd5e1; margin: 10px 0; }
            .flex { display: flex; justify-content: space-between; font-size: 12px; margin: 4px 0; }
            .bold { font-weight: bold; }
          </style>
        </head>
        <body>
          <h2>MINIMARKET POS</h2>
          <p>Struk Penjualan Resmi</p>
          <div class="line"></div>
          <div class="flex"><span>Invoice:</span><span class="bold">${trx.invoiceNumber}</span></div>
          <div class="flex"><span>Kasir:</span><span>${trx.cashierName}</span></div>
          <div class="flex"><span>Waktu:</span><span>${trx.date}</span></div>
          <div class="flex"><span>Metode:</span><span class="bold">${trx.paymentMethod}</span></div>
          <div class="line"></div>
          ${items}
          <div class="line"></div>
          <div class="flex bold"><span>TOTAL:</span><span>${formatRp(trx.grandTotal)}</span></div>
          <div class="flex"><span>Dibayar:</span><span>${formatRp(trx.paidAmount)}</span></div>
          <div class="flex"><span>Kembalian:</span><span>${formatRp(trx.changeAmount)}</span></div>
          <div class="line"></div>
          <p>-- Terima Kasih Selamat Belanja Kembali --</p>
        </body>
      </html>
    `);
    printWin.document.close();
    printWin.focus();
    setTimeout(() => {
      printWin.print();
    }, 250);
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-wide">Transaksi & Audit Shift Kasir</h1>
      <p class="text-xs text-slate-500 mt-1">Daftar struk penjualan, laporan rekap kas laci, dan audit selisih shift kasir</p>
    </div>

    {#if activeTab === 'transactions'}
      <button on:click={exportAllTransactionsXLSX} class="px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-2 shadow-sm transition-colors">
        <Download class="w-4 h-4 text-sky-600" />
        <span>EXPORT ALL TRANSACTIONS (.XLSX)</span>
      </button>
    {/if}
  </div>

  <!-- Navigation Tabs -->
  <div class="flex space-x-3 border-b border-slate-200 pb-1">
    <button
      on:click={() => activeTab = 'transactions'}
      class="px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 {activeTab === 'transactions' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}"
    >
      <FileText class="w-4 h-4" />
      <span>RIWAYAT TRANSAKSI</span>
    </button>
    <button
      on:click={() => activeTab = 'shifts'}
      class="px-4 py-2 text-xs font-bold rounded-xl transition-all flex items-center space-x-2 {activeTab === 'shifts' ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}"
    >
      <Clock class="w-4 h-4" />
      <span>REKAP & AUDIT SHIFT KASIR</span>
    </button>
  </div>

  {#if activeTab === 'transactions'}
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
            <th class="p-3.5">Member</th>
            <th class="p-3.5 text-center">Promo</th>
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
              <td class="p-3.5 font-medium text-slate-700">
                {#if t.memberName}
                  <span class="text-sky-700 font-bold">{t.memberName}</span>
                {:else}
                  <span class="text-slate-400 font-normal">-</span>
                {/if}
              </td>
              <td class="p-3.5 text-center">
                {#if t.promoCode}
                  <span class="px-2 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 font-mono font-bold text-[10px] rounded-full">
                    🏷️ {t.promoCode}
                  </span>
                {:else}
                  <span class="text-slate-400 font-normal">-</span>
                {/if}
              </td>
              <td class="p-3.5 text-center">
                <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] {t.paymentMethod === 'QRIS' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200'}">
                  {t.paymentMethod}
                </span>
              </td>
              <td class="p-3.5 text-right font-mono font-black text-slate-900">
                {formatRp(t.grandTotal)}
                {#if t.discount > 0}
                  <div class="text-[10px] text-amber-600 font-semibold">Diskon -{formatRp(t.discount)}</div>
                {/if}
              </td>
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
                  on:click={() => printDigitalReceipt(t)}
                  class="px-2.5 py-1 bg-sky-50 hover:bg-sky-100 text-sky-700 font-bold rounded-lg border border-sky-200"
                >
                  <Download class="w-3.5 h-3.5 inline mr-1" />
                  <span>Cetak / PDF</span>
                </button>
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {:else}
    <!-- Shift Audit View -->
    <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
      <h2 class="text-base font-bold text-slate-900 flex items-center space-x-2">
        <Clock class="w-5 h-5 text-sky-600" />
        <span>Laporan Audit Shift & Rekap Laci Kasir</span>
      </h2>

      <table class="w-full text-left text-xs text-slate-700">
        <thead class="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
          <tr>
            <th class="p-3">ID Shift</th>
            <th class="p-3">Kasir</th>
            <th class="p-3">Clock In</th>
            <th class="p-3">Clock Out</th>
            <th class="p-3 text-right">Kas Awal</th>
            <th class="p-3 text-right">Omset Tunai</th>
            <th class="p-3 text-right">Ekspektasi Laci</th>
            <th class="p-3 text-right">Fisik Laci</th>
            <th class="p-3 text-center">Selisih</th>
            <th class="p-3 text-center">Status</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-slate-100">
          {#each shifts as s}
            <tr class="hover:bg-slate-50">
              <td class="p-3 font-mono font-bold text-sky-700">{s.id}</td>
              <td class="p-3 font-bold text-slate-900">{s.cashierName}</td>
              <td class="p-3 text-slate-500 font-mono text-[11px]">{new Date(s.clockIn).toLocaleString('id-ID')}</td>
              <td class="p-3 text-slate-500 font-mono text-[11px]">{s.clockOut ? new Date(s.clockOut).toLocaleString('id-ID') : '-'}</td>
              <td class="p-3 text-right font-mono">{formatRp(s.startingCash || 0)}</td>
              <td class="p-3 text-right font-mono text-emerald-700 font-semibold">{formatRp(s.salesCash || 0)}</td>
              <td class="p-3 text-right font-mono font-bold text-slate-900">{formatRp(s.expectedCash || 0)}</td>
              <td class="p-3 text-right font-mono font-bold text-sky-700">{s.actualCash !== null ? formatRp(s.actualCash) : '-'}</td>
              <td class="p-3 text-center">
                {#if s.difference === 0}
                  <span class="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px] border border-emerald-200">
                    IMPAS (Rp 0)
                  </span>
                {:else if s.difference > 0}
                  <span class="px-2.5 py-0.5 bg-blue-50 text-blue-700 rounded-full font-bold text-[10px] border border-blue-200">
                    +{formatRp(s.difference)}
                  </span>
                {:else if s.difference < 0}
                  <span class="px-2.5 py-0.5 bg-red-50 text-red-700 rounded-full font-bold text-[10px] border border-red-200">
                    {formatRp(s.difference)}
                  </span>
                {:else}
                  <span class="text-slate-400">-</span>
                {/if}
              </td>
              <td class="p-3 text-center">
                {#if s.status === 'closed'}
                  <span class="px-2.5 py-0.5 bg-emerald-50 text-emerald-700 rounded-full font-bold text-[10px] border border-emerald-200">
                    CLOSED
                  </span>
                {:else}
                  <span class="px-2.5 py-0.5 bg-amber-50 text-amber-700 rounded-full font-bold text-[10px] border border-amber-200 animate-pulse">
                    OPEN
                  </span>
                {/if}
              </td>
            </tr>
          {/each}
        </tbody>
      </table>
    </div>
  {/if}
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
        <button on:click={() => printDigitalReceipt(selectedTrx)} class="py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center justify-center space-x-1 shadow-md shadow-sky-600/20">
          <Download class="w-4 h-4" />
          <span>UNDUH PDF / STRUK</span>
        </button>
        <button on:click={() => printDigitalReceipt(selectedTrx)} class="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center space-x-1 border border-slate-200">
          <Printer class="w-4 h-4" />
          <span>CETAK REPRINTS</span>
        </button>
      </div>
    </div>
  </div>
{/if}
