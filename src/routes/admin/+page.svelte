<script lang="ts">
  import { onMount } from 'svelte';
  import {
    TrendingUp,
    DollarSign,
    ShoppingBag,
    Award,
    AlertTriangle,
    ArrowUpRight,
    Download
  } from 'lucide-svelte';

  let analytics = {
    totalOmset: 15450000,
    netProfit: 3820000,
    totalTransactions: 248,
    averageOrderValue: 62298,
    topProducts: [
      { name: 'Indomie Goreng Spesial 85g', category: 'Mie & Makanan Instan', soldQty: 320, revenue: 1120000 },
      { name: 'Aqua Air Mineral 600ml', category: 'Air Mineral & Isotonik', soldQty: 215, revenue: 817000 },
      { name: 'Chitato Sapi Panggang 68g', category: 'Camilan & Snack', soldQty: 95, revenue: 1092500 },
      { name: 'Minyak Goreng Bimoli 1L', category: 'Bumbu & Dapur', soldQty: 80, revenue: 1560000 }
    ],
    lowStockAlerts: [
      { name: 'Khong Guan Red Assorted Biscuit 300g', stock: 2, minAlert: 3, category: 'Biskuit & Roti' },
      { name: 'Rexona Roll On Women 45ml', stock: 3, minAlert: 5, category: 'Sabun & Perawatan' }
    ]
  };

  onMount(async () => {
    try {
      const res = await fetch('/api/analytics/dashboard').then(r => r.json());
      if (res?.success && res.data) {
        analytics = { ...analytics, ...res.data };
      }
    } catch (e) {
      console.warn('Failed to load dashboard analytics from API', e);
    }
  });

  function formatRp(val: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  }

  function exportDashboardReport() {
    const today = new Date().toISOString().slice(0, 10);
    const rows = [
      ['LAPORAN RINGKASAN DASHBOARD MINIMARKET'],
      [`Tanggal Ekspor: ${today}`],
      [''],
      ['METRIK UTAMA'],
      ['Metrik', 'Nilai'],
      ['Total Omset (Gross)', analytics.totalOmset],
      ['Profit Bersih (Net)', analytics.netProfit],
      ['Total Transaksi', analytics.totalTransactions],
      ['Rata-rata Basket Size', analytics.averageOrderValue],
      [''],
      ['TOP SELLING PRODUCTS (PRODUK TERLARIS)'],
      ['Nama Produk', 'Kategori', 'Jumlah Terjual (pcs)', 'Total Pendapatan (Rp)'],
      ...analytics.topProducts.map(tp => [tp.name, tp.category, tp.soldQty, tp.revenue]),
      [''],
      ['PERINGATAN STOK MENIPIS'],
      ['Nama Produk', 'Kategori', 'Sisa Stok (pcs)', 'Batas Alert (pcs)'],
      ...analytics.lowStockAlerts.map(ls => [ls.name, ls.category, ls.stock, ls.minAlert])
    ];

    const csvContent = '\uFEFF' + rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `Laporan_Analitik_Minimarket_${today}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-wide">Dashboard Analitik Minimarket</h1>
      <p class="text-xs text-slate-500 mt-1">Ringkasan performa penjualan, profit bersih, dan stok barang</p>
    </div>

    <button on:click={exportDashboardReport} class="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-2 shadow-sm transition-colors">
      <Download class="w-4 h-4 text-sky-600" />
      <span>EXPORT LAPORAN (CSV/EXCEL)</span>
    </button>
  </div>

  <!-- Key Metrics Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Card 1: Total Omset -->
    <div class="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-sm">
      <div class="flex justify-between items-center text-slate-500">
        <span class="text-xs font-bold uppercase">Total Omset (Gross)</span>
        <div class="p-2 bg-sky-50 text-sky-600 rounded-xl">
          <TrendingUp class="w-5 h-5" />
        </div>
      </div>
      <div class="text-2xl font-black text-slate-900">{formatRp(analytics.totalOmset)}</div>
      <p class="text-[11px] text-emerald-600 flex items-center font-bold">
        <ArrowUpRight class="w-3.5 h-3.5 mr-0.5" />
        <span>+14.2% dari kemarin</span>
      </p>
    </div>

    <!-- Card 2: Net Profit -->
    <div class="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-sm">
      <div class="flex justify-between items-center text-slate-500">
        <span class="text-xs font-bold uppercase">Profit Bersih (Net)</span>
        <div class="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
          <DollarSign class="w-5 h-5" />
        </div>
      </div>
      <div class="text-2xl font-black text-emerald-600">{formatRp(analytics.netProfit)}</div>
      <p class="text-[11px] text-emerald-600 flex items-center font-bold">
        <ArrowUpRight class="w-3.5 h-3.5 mr-0.5" />
        <span>Margin bersih ~24.7%</span>
      </p>
    </div>

    <!-- Card 3: Total Transaksi -->
    <div class="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-sm">
      <div class="flex justify-between items-center text-slate-500">
        <span class="text-xs font-bold uppercase">Total Struk / Transaksi</span>
        <div class="p-2 bg-purple-50 text-purple-600 rounded-xl">
          <ShoppingBag class="w-5 h-5" />
        </div>
      </div>
      <div class="text-2xl font-black text-slate-900">{analytics.totalTransactions}</div>
      <p class="text-[11px] text-slate-500 font-semibold">Rata-rata 31 struk/jam</p>
    </div>

    <!-- Card 4: Average Order Value -->
    <div class="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-sm">
      <div class="flex justify-between items-center text-slate-500">
        <span class="text-xs font-bold uppercase">Rata-rata Basket Size</span>
        <div class="p-2 bg-amber-50 text-amber-600 rounded-xl">
          <Award class="w-5 h-5" />
        </div>
      </div>
      <div class="text-2xl font-black text-amber-600">{formatRp(analytics.averageOrderValue)}</div>
      <p class="text-[11px] text-slate-500 font-semibold">Per pelanggan</p>
    </div>
  </div>

  <!-- Tables Section: Top Products & Low Stock Alerts -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Top Products Table -->
    <div class="lg:col-span-2 bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
      <h2 class="text-base font-bold text-slate-900 flex items-center space-x-2">
        <Award class="w-5 h-5 text-amber-500" />
        <span>Top Selling Products (Produk Terlaris)</span>
      </h2>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-700">
          <thead class="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
            <tr>
              <th class="p-3">Nama Produk</th>
              <th class="p-3">Kategori</th>
              <th class="p-3 text-center">Terjual</th>
              <th class="p-3 text-right">Total Pendapatan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-100">
            {#each analytics.topProducts as tp}
              <tr class="hover:bg-slate-50">
                <td class="p-3 font-bold text-slate-900">{tp.name}</td>
                <td class="p-3"><span class="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-full font-mono text-[10px] border border-slate-200">{tp.category}</span></td>
                <td class="p-3 text-center font-bold text-sky-700">{tp.soldQty} pcs</td>
                <td class="p-3 text-right font-mono text-emerald-700 font-bold">{formatRp(tp.revenue)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Low Stock Alert Box -->
    <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
      <h2 class="text-base font-bold text-slate-900 flex items-center space-x-2">
        <AlertTriangle class="w-5 h-5 text-red-500" />
        <span>Peringatan Stok Menipis</span>
      </h2>

      <div class="space-y-3">
        {#each analytics.lowStockAlerts as ls}
          <div class="bg-red-50/50 border border-red-200 p-3 rounded-xl flex items-center justify-between">
            <div>
              <h4 class="text-xs font-bold text-slate-900">{ls.name}</h4>
              <p class="text-[10px] text-slate-500 mt-0.5">Min Alert Limit: {ls.minAlert} pcs</p>
            </div>
            <span class="px-2.5 py-1 bg-red-100 text-red-700 font-bold text-xs rounded-lg border border-red-200">
              Sisa {ls.stock} pcs
            </span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
