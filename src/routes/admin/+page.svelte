<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import {
    TrendingUp,
    DollarSign,
    ShoppingBag,
    Award,
    AlertTriangle,
    ArrowUpRight,
    Download,
    RefreshCw,
    Calendar,
    BarChart2
  } from 'lucide-svelte';

  export let data: any;

  let localAnalytics = data?.analytics;
  let isRefreshing = false;
  let intervalId: any;

  // ── Period filter state ──────────────────────────────────────────────
  type Period = 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom';
  let selectedPeriod: Period = 'monthly';

  // Default custom range = current month
  const todayStr = new Date().toISOString().slice(0, 10);
  const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10);
  let customFrom = firstOfMonth;
  let customTo = todayStr;

  // Revenue analytics state
  let revenueData: any = null;
  let isLoadingRevenue = false;

  const PERIOD_LABELS: Record<Period, string> = {
    daily: 'Hari Ini',
    weekly: '7 Hari Terakhir',
    monthly: 'Bulan Ini',
    yearly: 'Tahun Ini',
    custom: 'Custom Range'
  };

  $: analytics = localAnalytics || data?.analytics || {
    totalOmset: 0,
    netProfit: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    topProducts: [],
    lowStockAlerts: []
  };

  async function fetchLatestAnalytics() {
    isRefreshing = true;
    try {
      const res = await fetch('/api/analytics/dashboard').then(r => r.json());
      if (res?.success && res.data) {
        localAnalytics = res.data;
      }
    } catch (e) {
      console.warn('Failed to refresh analytics dashboard', e);
    } finally {
      isRefreshing = false;
    }
  }

  async function fetchRevenue() {
    isLoadingRevenue = true;
    try {
      let url = `/api/analytics/revenue?period=${selectedPeriod}`;
      if (selectedPeriod === 'custom') {
        url += `&dateFrom=${customFrom}&dateTo=${customTo}`;
      }
      const res = await fetch(url).then(r => r.json());
      if (res?.success && res.data) {
        revenueData = res.data;
      }
    } catch (e) {
      console.warn('Failed to fetch revenue data', e);
    } finally {
      isLoadingRevenue = false;
    }
  }

  function onPeriodChange(p: Period) {
    selectedPeriod = p;
    if (p !== 'custom') fetchRevenue();
  }

  function onCustomApply() {
    if (customFrom && customTo) fetchRevenue();
  }

  onMount(() => {
    fetchLatestAnalytics();
    fetchRevenue();
    intervalId = setInterval(fetchLatestAnalytics, 30000);
  });

  onDestroy(() => {
    if (intervalId) clearInterval(intervalId);
  });

  function formatRp(val: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  }

  function formatRpShort(val: number) {
    if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`;
    if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)} Jt`;
    if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)} Rb`;
    return `Rp ${val}`;
  }

  // ── Chart helpers ─────────────────────────────────────────────────────
  const CHART_H = 160;
  const CHART_PAD_LEFT = 48;
  const CHART_PAD_BOTTOM = 32;
  const CHART_PAD_TOP = 12;
  const CHART_PAD_RIGHT = 8;

  $: chartPoints = revenueData?.chartData || [];
  $: chartWidth = Math.max(chartPoints.length * 36, 300);
  $: maxOmset = Math.max(...chartPoints.map((d: any) => d.omset), 1);
  $: maxProfit = Math.max(...chartPoints.map((d: any) => d.profit), 1);
  $: chartMax = Math.max(maxOmset, 1);

  function barH(val: number) {
    return Math.max(2, ((val / chartMax) * (CHART_H - CHART_PAD_TOP - CHART_PAD_BOTTOM)));
  }

  function barY(val: number) {
    return CHART_H - CHART_PAD_BOTTOM - barH(val);
  }

  function yLabel(fraction: number) {
    return formatRpShort(chartMax * fraction);
  }

  function shortDate(dateStr: string) {
    const d = new Date(dateStr);
    if (chartPoints.length <= 7) {
      return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
    } else if (chartPoints.length <= 31) {
      return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
    } else {
      return d.toLocaleDateString('id-ID', { month: 'short', day: 'numeric' });
    }
  }

  async function exportDashboardReport() {
    const XLSX = await import('xlsx');
    const today = new Date().toISOString().slice(0, 10);

    const rows: (string | number)[][] = [
      ['LAPORAN RINGKASAN DASHBOARD MINIMARKET'],
      [`Tanggal Ekspor: ${today}`],
      [`Periode: ${revenueData ? `${revenueData.dateFrom} s/d ${revenueData.dateTo}` : 'Semua Waktu'}`],
      [],
      ['METRIK UTAMA'],
      ['Metrik', 'Nilai'],
      ['Total Omset (Gross)', revenueData?.totalOmset ?? analytics.totalOmset],
      ['Profit Bersih (Net)', revenueData?.netProfit ?? analytics.netProfit],
      ['Total Transaksi', revenueData?.totalTransactions ?? analytics.totalTransactions],
      ['Rata-rata Basket Size', revenueData?.averageOrderValue ?? analytics.averageOrderValue],
      [],
      ['TOP SELLING PRODUCTS (PRODUK TERLARIS)'],
      ['Nama Produk', 'Kategori', 'Jumlah Terjual (pcs)', 'Total Pendapatan (Rp)'],
      ...analytics.topProducts.map((tp: any) => [tp.name, tp.category, tp.soldQty, tp.revenue]),
      [],
      ['PERINGATAN STOK MENIPIS'],
      ['Nama Produk', 'Kategori', 'Sisa Stok (pcs)', 'Batas Alert Limit (pcs)'],
      ...analytics.lowStockAlerts.map((ls: any) => [ls.name, ls.category, ls.stock, ls.minAlert]),
      [],
      ...(revenueData?.chartData?.length ? [
        ['DETAIL PENDAPATAN HARIAN'],
        ['Tanggal', 'Omset (Rp)', 'Profit (Rp)', 'Jumlah Transaksi'],
        ...revenueData.chartData.map((d: any) => [d.date, d.omset, d.profit, d.transactions])
      ] : [])
    ];

    const ws = XLSX.utils.aoa_to_sheet(rows);
    const colWidths: number[] = [];
    rows.forEach(row => {
      row.forEach((cell, colIdx) => {
        const len = String(cell ?? '').length;
        colWidths[colIdx] = Math.max(colWidths[colIdx] ?? 10, len + 2);
      });
    });
    ws['!cols'] = colWidths.map(w => ({ wch: Math.min(w, 50) }));
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Dashboard Analitik');
    XLSX.writeFile(wb, `Laporan_Analitik_Minimarket_${today}.xlsx`);
  }
</script>

<div class="space-y-6">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-wide">Dashboard Analitik Minimarket</h1>
      <p class="text-xs text-slate-500 mt-1">Ringkasan performa penjualan, profit bersih, dan stok barang</p>
    </div>

    <div class="flex items-center space-x-2">
      <button on:click={fetchLatestAnalytics} class="px-3.5 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-1.5 shadow-sm transition-colors">
        <RefreshCw class="w-3.5 h-3.5 text-sky-600 {isRefreshing ? 'animate-spin' : ''}" />
        <span>SEGARKAN</span>
      </button>

      <button on:click={exportDashboardReport} class="px-4 py-2 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl flex items-center space-x-2 shadow-sm transition-colors">
        <Download class="w-4 h-4 text-sky-600" />
        <span>EXPORT LAPORAN (EXCEL)</span>
      </button>
    </div>
  </div>

  <!-- ── Period Filter Bar ─────────────────────────────────────────────── -->
  <div class="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
    <div class="flex items-center space-x-2 mb-1">
      <Calendar class="w-4 h-4 text-sky-600" />
      <span class="text-xs font-bold text-slate-700 uppercase tracking-wide">Filter Periode Penghasilan</span>
    </div>

    <!-- Quick period buttons -->
    <div class="flex flex-wrap gap-2">
      {#each (['daily', 'weekly', 'monthly', 'yearly', 'custom'] as Period[]) as p}
        <button
          on:click={() => onPeriodChange(p)}
          class="px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-colors
            {selectedPeriod === p
              ? 'bg-sky-600 text-white border-sky-600 shadow-md shadow-sky-200'
              : 'bg-white text-slate-600 border-slate-300 hover:bg-slate-50'}"
        >
          {PERIOD_LABELS[p]}
        </button>
      {/each}
    </div>

    <!-- Custom date range (shown only when selectedPeriod === 'custom') -->
    {#if selectedPeriod === 'custom'}
      <div class="flex flex-wrap items-end gap-3 pt-2 border-t border-slate-100">
        <div>
          <p class="text-[10px] text-slate-500 font-bold mb-1 uppercase">Dari Tanggal</p>
          <input type="date" bind:value={customFrom} max={customTo}
            class="px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 bg-white focus:outline-none focus:border-sky-500" />
        </div>
        <div>
          <p class="text-[10px] text-slate-500 font-bold mb-1 uppercase">Sampai Tanggal</p>
          <input type="date" bind:value={customTo} min={customFrom} max={todayStr}
            class="px-3 py-2 border border-slate-300 rounded-xl text-xs text-slate-900 bg-white focus:outline-none focus:border-sky-500" />
        </div>
        <button on:click={onCustomApply}
          class="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm">
          Tampilkan
        </button>
      </div>
    {/if}
  </div>

  <!-- ── Revenue Summary Cards (filtered by period) ──────────────────── -->
  {#if revenueData}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <!-- Omset -->
      <div class="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-sm">
        <div class="flex justify-between items-center text-slate-500">
          <span class="text-xs font-bold uppercase">Total Omset</span>
          <div class="p-2 bg-sky-50 text-sky-600 rounded-xl"><TrendingUp class="w-5 h-5" /></div>
        </div>
        <div class="text-2xl font-black text-slate-900">{formatRp(revenueData.totalOmset)}</div>
        <p class="text-[11px] text-slate-500 font-semibold">{PERIOD_LABELS[selectedPeriod]}</p>
      </div>

      <!-- Profit -->
      <div class="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-sm">
        <div class="flex justify-between items-center text-slate-500">
          <span class="text-xs font-bold uppercase">Profit Bersih</span>
          <div class="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign class="w-5 h-5" /></div>
        </div>
        <div class="text-2xl font-black text-emerald-600">{formatRp(revenueData.netProfit)}</div>
        <p class="text-[11px] text-emerald-600 font-semibold">
          {revenueData.totalOmset > 0 ? ((revenueData.netProfit / revenueData.totalOmset) * 100).toFixed(1) : 0}% margin
        </p>
      </div>

      <!-- Transaksi -->
      <div class="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-sm">
        <div class="flex justify-between items-center text-slate-500">
          <span class="text-xs font-bold uppercase">Total Transaksi</span>
          <div class="p-2 bg-purple-50 text-purple-600 rounded-xl"><ShoppingBag class="w-5 h-5" /></div>
        </div>
        <div class="text-2xl font-black text-slate-900">{revenueData.totalTransactions}</div>
        <p class="text-[11px] text-slate-500 font-semibold">struk</p>
      </div>

      <!-- Avg Order -->
      <div class="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-sm">
        <div class="flex justify-between items-center text-slate-500">
          <span class="text-xs font-bold uppercase">Rata-rata Basket</span>
          <div class="p-2 bg-amber-50 text-amber-600 rounded-xl"><Award class="w-5 h-5" /></div>
        </div>
        <div class="text-2xl font-black text-amber-600">{formatRp(revenueData.averageOrderValue)}</div>
        <p class="text-[11px] text-slate-500 font-semibold">per pelanggan</p>
      </div>
    </div>

    <!-- ── Bar Chart ─────────────────────────────────────────────────────── -->
    <div class="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
      <div class="flex items-center justify-between">
        <h2 class="text-base font-bold text-slate-900 flex items-center space-x-2">
          <BarChart2 class="w-5 h-5 text-sky-500" />
          <span>Grafik Pendapatan — {PERIOD_LABELS[selectedPeriod]}</span>
        </h2>
        <div class="flex items-center space-x-4 text-[10px] font-bold">
          <span class="flex items-center space-x-1"><span class="inline-block w-3 h-3 rounded bg-sky-500"></span><span class="text-slate-500">Omset</span></span>
          <span class="flex items-center space-x-1"><span class="inline-block w-3 h-3 rounded bg-emerald-400"></span><span class="text-slate-500">Profit</span></span>
        </div>
      </div>

      {#if isLoadingRevenue}
        <div class="flex items-center justify-center h-48 text-slate-400 text-sm">Memuat data...</div>
      {:else if chartPoints.length === 0}
        <div class="flex items-center justify-center h-48 text-slate-400 text-sm">Tidak ada transaksi di periode ini</div>
      {:else}
        <div class="overflow-x-auto">
          <svg
            width={Math.max(chartPoints.length * 44 + CHART_PAD_LEFT + CHART_PAD_RIGHT, 400)}
            height={CHART_H + 8}
            class="block"
          >
            <!-- Y axis grid lines & labels -->
            {#each [0, 0.25, 0.5, 0.75, 1] as frac}
              {@const gy = barY(chartMax * frac) + barH(chartMax * frac)}
              <line x1={CHART_PAD_LEFT} y1={gy} x2={chartPoints.length * 44 + CHART_PAD_LEFT} y2={gy}
                stroke="#e2e8f0" stroke-width="1" />
              <text x={CHART_PAD_LEFT - 4} y={gy + 3} text-anchor="end" font-size="8" fill="#94a3b8" font-family="monospace">
                {yLabel(frac)}
              </text>
            {/each}

            <!-- Bars -->
            {#each chartPoints as d, i}
              {@const bw = 16}
              {@const gap = 44}
              {@const x = CHART_PAD_LEFT + i * gap}

              <!-- Omset bar -->
              <rect
                x={x + 2}
                y={barY(d.omset)}
                width={bw}
                height={barH(d.omset)}
                rx="3"
                fill="#0ea5e9"
                opacity="0.85"
              />
              <!-- Profit bar -->
              <rect
                x={x + bw + 4}
                y={barY(d.profit)}
                width={bw}
                height={barH(d.profit)}
                rx="3"
                fill="#34d399"
                opacity="0.85"
              />

              <!-- X label -->
              <text
                x={x + bw + 2}
                y={CHART_H - CHART_PAD_BOTTOM + 14}
                text-anchor="middle"
                font-size="8"
                fill="#64748b"
                font-family="system-ui"
              >
                {shortDate(d.date)}
              </text>

              <!-- Transaction count dot -->
              {#if d.transactions > 0}
                <text x={x + bw + 2} y={barY(d.omset) - 3} text-anchor="middle" font-size="7" fill="#0ea5e9" font-family="monospace">
                  {d.transactions}
                </text>
              {/if}
            {/each}

            <!-- Y axis line -->
            <line x1={CHART_PAD_LEFT} y1={CHART_PAD_TOP} x2={CHART_PAD_LEFT} y2={CHART_H - CHART_PAD_BOTTOM}
              stroke="#cbd5e1" stroke-width="1" />
          </svg>
        </div>

        <!-- Summary row below chart -->
        <div class="grid grid-cols-3 gap-3 pt-2 border-t border-slate-100">
          {#each chartPoints.slice(-7) as d}
            <div class="text-center">
              <p class="text-[9px] text-slate-400 font-mono">{d.date}</p>
              <p class="text-xs font-bold text-sky-700">{formatRpShort(d.omset)}</p>
              <p class="text-[10px] text-emerald-600 font-semibold">{formatRpShort(d.profit)}</p>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  {:else}
    <!-- Fallback cards saat revenue belum loaded -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <div class="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-sm">
        <div class="flex justify-between items-center text-slate-500">
          <span class="text-xs font-bold uppercase">Total Omset (Gross)</span>
          <div class="p-2 bg-sky-50 text-sky-600 rounded-xl"><TrendingUp class="w-5 h-5" /></div>
        </div>
        <div class="text-2xl font-black text-slate-900">{formatRp(analytics.totalOmset)}</div>
        <p class="text-[11px] text-emerald-600 flex items-center font-bold">
          <ArrowUpRight class="w-3.5 h-3.5 mr-0.5" />
          <span>Semua Waktu</span>
        </p>
      </div>
      <div class="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-sm">
        <div class="flex justify-between items-center text-slate-500">
          <span class="text-xs font-bold uppercase">Profit Bersih (Net)</span>
          <div class="p-2 bg-emerald-50 text-emerald-600 rounded-xl"><DollarSign class="w-5 h-5" /></div>
        </div>
        <div class="text-2xl font-black text-emerald-600">{formatRp(analytics.netProfit)}</div>
      </div>
      <div class="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-sm">
        <div class="flex justify-between items-center text-slate-500">
          <span class="text-xs font-bold uppercase">Total Struk / Transaksi</span>
          <div class="p-2 bg-purple-50 text-purple-600 rounded-xl"><ShoppingBag class="w-5 h-5" /></div>
        </div>
        <div class="text-2xl font-black text-slate-900">{analytics.totalTransactions}</div>
      </div>
      <div class="bg-white border border-slate-200 p-5 rounded-2xl space-y-2 shadow-sm">
        <div class="flex justify-between items-center text-slate-500">
          <span class="text-xs font-bold uppercase">Rata-rata Basket Size</span>
          <div class="p-2 bg-amber-50 text-amber-600 rounded-xl"><Award class="w-5 h-5" /></div>
        </div>
        <div class="text-2xl font-black text-amber-600">{formatRp(analytics.averageOrderValue)}</div>
      </div>
    </div>
  {/if}

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
