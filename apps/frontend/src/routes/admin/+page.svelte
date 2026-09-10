<script lang="ts">
  import {
    TrendingUp,
    DollarSign,
    ShoppingBag,
    Award,
    AlertTriangle,
    ArrowUpRight,
    Download
  } from 'lucide-svelte';

  const analytics = {
    totalOmset: 15450000,
    netProfit: 3820000,
    totalTransactions: 248,
    averageOrderValue: 62298,
    topProducts: [
      { name: 'Indomie Goreng Original 85g', category: 'Makanan', soldQty: 320, revenue: 1024000 },
      { name: 'Air Mineral Aqua 600ml', category: 'Minuman', soldQty: 215, revenue: 752500 },
      { name: 'Chitato Sapi Panggang 68g', category: 'Snack', soldQty: 95, revenue: 1045000 },
      { name: 'Milo Powder 3in1 20g', category: 'Minuman', soldQty: 140, revenue: 420000 }
    ],
    lowStockAlerts: [
      { name: 'Roti Tawar Kupas Sari Roti', stock: 3, minAlert: 5, category: 'Makanan' },
      { name: 'Pepsodent Soft 190g', stock: 4, minAlert: 10, category: 'Personal Care' }
    ]
  };

  function formatRp(val: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-white tracking-wide">Dashboard Analitik Minimarket</h1>
      <p class="text-xs text-slate-400 mt-1">Ringkasan performa penjualan, profit bersih, dan stok barang</p>
    </div>

    <button on:click={() => alert('Laporan PDF/Excel sedang di-generate!')} class="px-4 py-2 bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 text-xs font-bold rounded-xl flex items-center space-x-2">
      <Download class="w-4 h-4 text-sky-400" />
      <span>EXPORT LAPORAN</span>
    </button>
  </div>

  <!-- Key Metrics Cards -->
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
    <!-- Card 1: Total Omset -->
    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
      <div class="flex justify-between items-center text-slate-400">
        <span class="text-xs font-semibold uppercase">Total Omset (Gross)</span>
        <div class="p-2 bg-sky-500/10 text-sky-400 rounded-xl">
          <TrendingUp class="w-5 h-5" />
        </div>
      </div>
      <div class="text-2xl font-black text-white">{formatRp(analytics.totalOmset)}</div>
      <p class="text-[11px] text-emerald-400 flex items-center font-medium">
        <ArrowUpRight class="w-3.5 h-3.5 mr-0.5" />
        <span>+14.2% dari kemarin</span>
      </p>
    </div>

    <!-- Card 2: Net Profit -->
    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
      <div class="flex justify-between items-center text-slate-400">
        <span class="text-xs font-semibold uppercase">Profit Bersih (Net)</span>
        <div class="p-2 bg-emerald-500/10 text-emerald-400 rounded-xl">
          <DollarSign class="w-5 h-5" />
        </div>
      </div>
      <div class="text-2xl font-black text-emerald-400">{formatRp(analytics.netProfit)}</div>
      <p class="text-[11px] text-emerald-400 flex items-center font-medium">
        <ArrowUpRight class="w-3.5 h-3.5 mr-0.5" />
        <span>Margin bersih ~24.7%</span>
      </p>
    </div>

    <!-- Card 3: Total Transaksi -->
    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
      <div class="flex justify-between items-center text-slate-400">
        <span class="text-xs font-semibold uppercase">Total Struk / Transaksi</span>
        <div class="p-2 bg-purple-500/10 text-purple-400 rounded-xl">
          <ShoppingBag class="w-5 h-5" />
        </div>
      </div>
      <div class="text-2xl font-black text-white">{analytics.totalTransactions}</div>
      <p class="text-[11px] text-slate-400 font-medium">Rata-rata 31 struk/jam</p>
    </div>

    <!-- Card 4: Average Order Value -->
    <div class="bg-slate-900 border border-slate-800 p-5 rounded-2xl space-y-2">
      <div class="flex justify-between items-center text-slate-400">
        <span class="text-xs font-semibold uppercase">Rata-rata Basket Size</span>
        <div class="p-2 bg-amber-500/10 text-amber-400 rounded-xl">
          <Award class="w-5 h-5" />
        </div>
      </div>
      <div class="text-2xl font-black text-amber-400">{formatRp(analytics.averageOrderValue)}</div>
      <p class="text-[11px] text-slate-400 font-medium">Per pelanggan</p>
    </div>
  </div>

  <!-- Tables Section: Top Products & Low Stock Alerts -->
  <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
    <!-- Top Products Table -->
    <div class="lg:col-span-2 bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <h2 class="text-base font-bold text-white flex items-center space-x-2">
        <Award class="w-5 h-5 text-amber-400" />
        <span>Top Selling Products (Produk Terlaris)</span>
      </h2>

      <div class="overflow-x-auto">
        <table class="w-full text-left text-xs text-slate-300">
          <thead class="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
            <tr>
              <th class="p-3">Nama Produk</th>
              <th class="p-3">Kategori</th>
              <th class="p-3 text-center">Terjual</th>
              <th class="p-3 text-right">Total Pendapatan</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-slate-800/60">
            {#each analytics.topProducts as tp}
              <tr class="hover:bg-slate-800/40">
                <td class="p-3 font-semibold text-white">{tp.name}</td>
                <td class="p-3"><span class="px-2 py-0.5 bg-slate-800 text-slate-400 rounded-full font-mono text-[10px]">{tp.category}</span></td>
                <td class="p-3 text-center font-bold text-sky-400">{tp.soldQty} pcs</td>
                <td class="p-3 text-right font-mono text-emerald-400 font-bold">{formatRp(tp.revenue)}</td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>
    </div>

    <!-- Low Stock Alert Box -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
      <h2 class="text-base font-bold text-white flex items-center space-x-2">
        <AlertTriangle class="w-5 h-5 text-red-400" />
        <span>Peringatan Stok Menipis</span>
      </h2>

      <div class="space-y-3">
        {#each analytics.lowStockAlerts as ls}
          <div class="bg-slate-950 border border-red-500/30 p-3 rounded-xl flex items-center justify-between">
            <div>
              <h4 class="text-xs font-bold text-slate-200">{ls.name}</h4>
              <p class="text-[10px] text-slate-400 mt-0.5">Min Alert Limit: {ls.minAlert} pcs</p>
            </div>
            <span class="px-2.5 py-1 bg-red-500/20 text-red-400 font-bold text-xs rounded-lg border border-red-500/30">
              Sisa {ls.stock} pcs
            </span>
          </div>
        {/each}
      </div>
    </div>
  </div>
</div>
