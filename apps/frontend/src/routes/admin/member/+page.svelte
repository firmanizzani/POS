<script lang="ts">
  import { Plus, Phone } from 'lucide-svelte';

  let members = [
    { code: 'MBR-001', name: 'Siti Rahma', phone: '081298765432', points: 450, tier: 'GOLD' },
    { code: 'MBR-002', name: 'Dedi Kurniawan', phone: '085712345678', points: 120, tier: 'SILVER' }
  ];
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-wide">Manajemen Member & Poin Loyalty</h1>
      <p class="text-xs text-slate-500 mt-1">Registrasi pelanggan setia & sistem akumulasi poin reward</p>
    </div>

    <button on:click={() => alert('Form Tambah Member Baru')} class="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-md shadow-sky-600/20">
      <Plus class="w-4 h-4" />
      <span>REGISTRASI MEMBER</span>
    </button>
  </div>

  <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-sm">
    <table class="w-full text-left text-xs text-slate-700">
      <thead class="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
        <tr>
          <th class="p-3">Kode Member</th>
          <th class="p-3">Nama Member</th>
          <th class="p-3">No. HP</th>
          <th class="p-3 text-center">Poin Active</th>
          <th class="p-3 text-center">Tier</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-100">
        {#each members as m}
          <tr class="hover:bg-slate-50">
            <td class="p-3 font-mono font-bold text-sky-700">{m.code}</td>
            <td class="p-3 font-bold text-slate-900">{m.name}</td>
            <td class="p-3 text-slate-500 font-mono flex items-center space-x-1">
              <Phone class="w-3.5 h-3.5" />
              <span>{m.phone}</span>
            </td>
            <td class="p-3 text-center font-bold text-amber-600 font-mono text-sm">{m.points} pts</td>
            <td class="p-3 text-center">
              <span class="px-2.5 py-0.5 rounded-full font-bold text-[10px] bg-amber-50 text-amber-700 border border-amber-200">
                {m.tier}
              </span>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>
