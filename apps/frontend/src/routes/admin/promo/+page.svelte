<script lang="ts">
  import { Percent, Plus, Tag, Calendar, CheckCircle2 } from 'lucide-svelte';

  let promos = [
    { code: 'PROMO-JUMAT', title: 'Diskon Jumat Berkah 10%', type: 'PERCENTAGE', value: '10%', minPurchase: 50000, status: 'ACTIVE' },
    { code: 'POTONGAN5K', title: 'Potongan Langsung 5 Ribu', type: 'FIXED', value: 'Rp 5.000', minPurchase: 75000, status: 'ACTIVE' }
  ];

  function formatRp(val: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-white tracking-wide">Sistem Promo & Diskon Engine</h1>
      <p class="text-xs text-slate-400 mt-1">Pengaturan kupon diskon, minimal belanja & promo spesial toko</p>
    </div>

    <button on:click={() => alert('Form Promo Baru')} class="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2">
      <Plus class="w-4 h-4" />
      <span>BUAT PROMO BARU</span>
    </button>
  </div>

  <div class="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4">
    <table class="w-full text-left text-xs text-slate-300">
      <thead class="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
        <tr>
          <th class="p-3">Kode Kupon</th>
          <th class="p-3">Judul Promo</th>
          <th class="p-3">Nilai Diskon</th>
          <th class="p-3 text-right">Min. Belanja</th>
          <th class="p-3 text-center">Status</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800">
        {#each promos as pr}
          <tr class="hover:bg-slate-800/40">
            <td class="p-3 font-mono font-bold text-amber-400 flex items-center space-x-1">
              <Tag class="w-3.5 h-3.5" />
              <span>{pr.code}</span>
            </td>
            <td class="p-3 font-semibold text-white">{pr.title}</td>
            <td class="p-3 font-bold text-sky-400 font-mono">{pr.value}</td>
            <td class="p-3 text-right font-mono text-slate-400">{formatRp(pr.minPurchase)}</td>
            <td class="p-3 text-center">
              <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                {pr.status}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
