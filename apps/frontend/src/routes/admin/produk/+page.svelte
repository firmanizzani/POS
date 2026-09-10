<script lang="ts">
  import { Package, Plus, Search, Edit3, Trash2, Barcode, Image, X, Check } from 'lucide-svelte';

  let products = [
    { id: 'prod-1', barcode: '899100110011', sku: 'IND-MIE-GORENG', name: 'Indomie Goreng Original 85g', category: 'Makanan', costPrice: 2800, sellPrice: 3200, stock: 120, unit: 'pcs', imageUrl: 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=150' },
    { id: 'prod-2', barcode: '899200220022', sku: 'AQUA-600ML', name: 'Air Mineral Aqua 600ml', category: 'Minuman', costPrice: 2500, sellPrice: 3500, stock: 85, unit: 'botol', imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1bc4e?w=150' }
  ];

  let searchQuery = '';
  let showModal = false;
  let editingId: string | null = null;

  let form = {
    barcode: '',
    sku: '',
    name: '',
    category: 'Makanan',
    costPrice: 0,
    sellPrice: 0,
    stock: 0,
    unit: 'pcs',
    imageUrl: ''
  };

  $: filtered = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery));

  function openCreateModal() {
    editingId = null;
    form = { barcode: `899${Math.floor(100000000 + Math.random() * 900000000)}`, sku: '', name: '', category: 'Makanan', costPrice: 0, sellPrice: 0, stock: 0, unit: 'pcs', imageUrl: '' };
    showModal = true;
  }

  function saveProduct() {
    if (!form.name || !form.barcode) {
      alert('Nama produk & barcode wajib diisi!');
      return;
    }

    if (editingId) {
      products = products.map(p => p.id === editingId ? { ...p, ...form } : p);
    } else {
      products = [...products, { id: `prod-${Date.now()}`, ...form }];
    }
    showModal = false;
  }

  function deleteProduct(id: string) {
    if (confirm('Yakin ingin menghapus produk ini?')) {
      products = products.filter(p => p.id !== id);
    }
  }

  function formatRp(val: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-white tracking-wide">Master Data Produk</h1>
      <p class="text-xs text-slate-400 mt-1">Kelola katalog barang, foto, barcode & HPP modal</p>
    </div>

    <button on:click={openCreateModal} class="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-lg shadow-sky-900/30">
      <Plus class="w-4 h-4" />
      <span>TAMBAH PRODUK BARU</span>
    </button>
  </div>

  <!-- Search & Filters -->
  <div class="flex items-center space-x-3 bg-slate-900 border border-slate-800 p-3 rounded-2xl">
    <Search class="w-5 h-5 text-slate-400 ml-1" />
    <input type="text" bind:value={searchQuery} placeholder="Cari nama produk, SKU, atau scan barcode..." class="bg-transparent text-white text-sm focus:outline-none w-full" />
  </div>

  <!-- Products Table -->
  <div class="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
    <table class="w-full text-left text-xs text-slate-300">
      <thead class="bg-slate-950 text-slate-400 uppercase font-semibold border-b border-slate-800">
        <tr>
          <th class="p-3.5">Produk</th>
          <th class="p-3.5">Barcode / SKU</th>
          <th class="p-3.5">Kategori</th>
          <th class="p-3.5 text-right">Modal (HPP)</th>
          <th class="p-3.5 text-right">Harga Jual</th>
          <th class="p-3.5 text-center">Stok</th>
          <th class="p-3.5 text-center">Aksi</th>
        </tr>
      </thead>
      <tbody class="divide-y divide-slate-800">
        {#each filtered as p}
          <tr class="hover:bg-slate-800/40">
            <td class="p-3.5 font-semibold text-white flex items-center space-x-3">
              <div class="w-10 h-10 rounded-lg bg-slate-800 overflow-hidden flex items-center justify-center border border-slate-700">
                {#if p.imageUrl}
                  <img src={p.imageUrl} alt={p.name} class="w-full h-full object-cover" />
                {:else}
                  <Package class="w-5 h-5 text-slate-500" />
                {/if}
              </div>
              <div>
                <p class="font-bold text-slate-100">{p.name}</p>
                <span class="text-[10px] text-slate-500 font-mono">{p.unit}</span>
              </div>
            </td>
            <td class="p-3.5 font-mono text-slate-300">
              <div class="flex items-center space-x-1 text-sky-400 font-bold">
                <Barcode class="w-4 h-4" />
                <span>{p.barcode}</span>
              </div>
              <span class="text-[10px] text-slate-500">{p.sku}</span>
            </td>
            <td class="p-3.5"><span class="px-2.5 py-1 bg-slate-800 text-slate-300 rounded-full font-mono text-[10px]">{p.category}</span></td>
            <td class="p-3.5 text-right font-mono text-slate-400">{formatRp(p.costPrice)}</td>
            <td class="p-3.5 text-right font-mono text-emerald-400 font-bold">{formatRp(p.sellPrice)}</td>
            <td class="p-3.5 text-center font-bold font-mono"><span class="px-2 py-0.5 rounded bg-slate-800 text-sky-400">{p.stock}</span></td>
            <td class="p-3.5 text-center space-x-2">
              <button on:click={() => { editingId = p.id; form = { ...p }; showModal = true; }} class="p-1.5 bg-slate-800 hover:bg-slate-700 text-sky-400 rounded-lg">
                <Edit3 class="w-4 h-4" />
              </button>
              <button on:click={() => deleteProduct(p.id)} class="p-1.5 bg-slate-800 hover:bg-slate-700 text-red-400 rounded-lg">
                <Trash2 class="w-4 h-4" />
              </button>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
</div>

<!-- Modal Form Create/Edit -->
{#if showModal}
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl max-w-lg w-full p-6 space-y-4">
      <div class="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 class="text-base font-bold text-white">{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
        <button on:click={() => showModal = false} class="text-slate-400 hover:text-white"><X class="w-5 h-5" /></button>
      </div>

      <div class="space-y-3 text-xs">
        <div>
          <label class="text-slate-400">Barcode</label>
          <input type="text" bind:value={form.barcode} class="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 mt-1 font-mono" />
        </div>
        <div>
          <label class="text-slate-400">Nama Produk</label>
          <input type="text" bind:value={form.name} class="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 mt-1" />
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-slate-400">Harga Modal (HPP)</label>
            <input type="number" bind:value={form.costPrice} class="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 mt-1" />
          </div>
          <div>
            <label class="text-slate-400">Harga Jual</label>
            <input type="number" bind:value={form.sellPrice} class="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 mt-1" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-slate-400">Stok Awal</label>
            <input type="number" bind:value={form.stock} class="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 mt-1" />
          </div>
          <div>
            <label class="text-slate-400">Satuan (Unit)</label>
            <input type="text" bind:value={form.unit} class="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 mt-1" />
          </div>
        </div>
        <div>
          <label class="text-slate-400">URL Gambar (Opsional)</label>
          <input type="text" bind:value={form.imageUrl} placeholder="https://..." class="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-3 py-2 mt-1" />
        </div>
      </div>

      <button on:click={saveProduct} class="w-full py-3 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider">
        SIMPAN PRODUK
      </button>
    </div>
  </div>
{/if}
