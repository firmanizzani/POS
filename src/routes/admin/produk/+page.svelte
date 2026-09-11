<script lang="ts">
  import { onMount } from 'svelte';
  import { Package, Plus, Search, Edit3, Trash2, Barcode, X, Upload } from 'lucide-svelte';

  let products: any[] = [];

  const categories = [
    { id: 'cat-1',  code: 'MIE',  name: 'Mie & Makanan Instan' },
    { id: 'cat-2',  code: 'BSK',  name: 'Biskuit & Roti' },
    { id: 'cat-3',  code: 'SNK',  name: 'Camilan & Snack' },
    { id: 'cat-4',  code: 'AIR',  name: 'Air Mineral & Isotonik' },
    { id: 'cat-5',  code: 'MIN',  name: 'Minuman Kemasan & Susu' },
    { id: 'cat-6',  code: 'DPR',  name: 'Bumbu & Kebutuhan Dapur' },
    { id: 'cat-7',  code: 'SBN',  name: 'Sabun & Perawatan Tubuh' },
    { id: 'cat-8',  code: 'KBR',  name: 'Kebutuhan Kebersihan Rumah' },
    { id: 'cat-9',  code: 'BAY',  name: 'Kebutuhan Ibu & Bayi' },
    { id: 'cat-10', code: 'RMH',  name: 'Perlengkapan Rumah Tangga' },
  ];

  onMount(async () => {
    try {
      const res = await fetch('/api/products').then(r => r.json());
      if (res?.success && Array.isArray(res.data)) {
        products = res.data.map((p: any) => ({
          id: p.id,
          barcode: p.barcode,
          sku: p.sku,
          name: p.name,
          category: p.categoryName || 'Lainnya',
          categoryId: p.categoryId,
          costPrice: Number(p.costPrice),
          sellPrice: Number(p.sellPrice),
          stock: Number(p.stock),
          unit: p.unit || 'pcs',
          imageUrl: p.imageUrl || ''
        }));
      }
    } catch (e) {
      console.warn('Failed fetching products from API', e);
    }
  });

  let searchQuery = '';
  let showModal = false;
  let editingId: string | null = null;
  let isUploading = false;
  let isSaving = false;
  let uploadError = '';

  let form = {
    barcode: '',
    sku: '',
    name: '',
    category: 'Mie & Makanan Instan',
    categoryId: 'cat-1',
    costPrice: 0,
    sellPrice: 0,
    stock: 0,
    unit: 'pcs',
    imageUrl: ''
  };

  $: filtered = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery));

  let isSkuTouched = false;

  function getCategoryCode(categoryId: string) {
    return categories.find(c => c.id === categoryId)?.code || 'PRD';
  }

  function generateSku() {
    if (isSkuTouched) return;
    const clean = form.name
      .toUpperCase()
      .replace(/(?<=\d)(ML|G|KG|L|CL|PCS|PACK|GR|GRAM)\b/gi, '')
      .replace(/[^A-Z0-9\s]/g, '')
      .trim()
      .split(/\s+/)
      .join('-');
    
    if (clean.length <= 20) {
      form.sku = clean;
    } else {
      const truncated = clean.slice(0, 20);
      const lastDash = truncated.lastIndexOf('-');
      form.sku = lastDash > 0 ? truncated.slice(0, lastDash) : truncated;
    }
  }

  function handleNameInput() {
    if (!editingId) generateSku();
  }

  function handleCategoryChange() {
    // Kategori berubah tidak mengubah SKU jika user menginginkan SKU murni dari nama produk
  }

  function openCreateModal() {
    editingId = null;
    uploadError = '';
    isSkuTouched = false;
    form = {
      barcode: `899${Math.floor(100000000 + Math.random() * 900000000)}`,
      sku: '',
      name: '',
      category: 'Mie & Makanan Instan',
      categoryId: 'cat-1',
      costPrice: 0,
      sellPrice: 0,
      stock: 0,
      unit: 'pcs',
      imageUrl: ''
    };
    showModal = true;
  }

  async function handleFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    uploadError = '';
    isUploading = true;

    try {
      const fd = new FormData();
      fd.append('file', file);
      if (form.name) {
        fd.append('productName', form.name);
      }
      const res = await fetch('/api/upload', { method: 'POST', body: fd }).then(r => r.json());
      if (res.success && res.url) {
        form = { ...form, imageUrl: res.url };
      } else {
        uploadError = res.message || 'Gagal upload gambar';
      }
    } catch (e: any) {
      uploadError = 'Gagal upload: ' + e.message;
    } finally {
      isUploading = false;
      input.value = '';
    }
  }

  async function saveProduct() {
    if (!form.name || !form.barcode) {
      alert('Nama produk & barcode wajib diisi!');
      return;
    }

    let finalSku = form.sku ? form.sku.toUpperCase() : '';
    if (!finalSku) {
      const clean = form.name
        .toUpperCase()
        .replace(/(?<=\d)(ML|G|KG|L|CL|PCS|PACK|GR|GRAM)\b/gi, '')
        .replace(/[^A-Z0-9\s]/g, '')
        .trim()
        .split(/\s+/)
        .join('-');
      if (clean.length <= 20) {
        finalSku = clean;
      } else {
        const truncated = clean.slice(0, 20);
        const lastDash = truncated.lastIndexOf('-');
        finalSku = lastDash > 0 ? truncated.slice(0, lastDash) : truncated;
      }
      if (!finalSku) finalSku = `SKU-${Date.now()}`;
    }

    isSaving = true;
    try {
      if (editingId) {
        const res = await fetch(`/api/products/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barcode: form.barcode,
            sku: finalSku,
            name: form.name,
            categoryId: form.categoryId || null,
            costPrice: Number(form.costPrice),
            sellPrice: Number(form.sellPrice),
            stock: Number(form.stock),
            unit: form.unit,
            imageUrl: form.imageUrl || null
          })
        }).then(r => r.json());

        if (res.success) {
          const updatedImageUrl = res.data?.imageUrl !== undefined ? (res.data.imageUrl || '') : form.imageUrl;
          const catName = categories.find(c => c.id === form.categoryId)?.name || form.category;
          products = products.map(p => p.id === editingId ? { ...p, ...form, sku: finalSku, category: catName, imageUrl: updatedImageUrl } : p);
        } else {
          alert('Gagal mengupdate produk: ' + (res.message || 'Unknown error'));
          return;
        }
      } else {
        const res = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            barcode: form.barcode,
            sku: finalSku,
            name: form.name,
            categoryId: form.categoryId || null,
            costPrice: Number(form.costPrice),
            sellPrice: Number(form.sellPrice),
            stock: Number(form.stock),
            unit: form.unit,
            imageUrl: form.imageUrl || null
          })
        }).then(r => r.json());

        if (res.success) {
          const catName = categories.find(c => c.id === form.categoryId)?.name || form.category;
          const newProductData = {
            id: res.data?.id || `prod-${Date.now()}`,
            ...form,
            sku: res.data?.sku || finalSku,
            category: catName,
            imageUrl: res.data?.imageUrl || form.imageUrl || ''
          };
          products = [...products, newProductData];
        } else {
          alert('Gagal menyimpan produk: ' + (res.message || 'Unknown error'));
          return;
        }
      }
      showModal = false;
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      isSaving = false;
    }
  }

  async function deleteProduct(id: string) {
    if (confirm('Yakin ingin menghapus produk ini?')) {
      try {
        const res = await fetch(`/api/products/${id}`, { method: 'DELETE' }).then(r => r.json());
        if (res.success) {
          products = products.filter(p => p.id !== id);
        } else {
          alert('Gagal menghapus produk: ' + res.message);
        }
      } catch (e: any) {
        alert('Error hapus produk: ' + e.message);
      }
    }
  }

  function formatRp(val: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  }
</script>

<div class="space-y-6">
  <div class="flex justify-between items-center">
    <div>
      <h1 class="text-2xl font-bold text-slate-900 tracking-wide">Master Data Produk</h1>
      <p class="text-xs text-slate-500 mt-1">Kelola katalog barang, foto, barcode & HPP modal</p>
    </div>

    <button on:click={openCreateModal} class="px-4 py-2.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl flex items-center space-x-2 shadow-md shadow-sky-600/20">
      <Plus class="w-4 h-4" />
      <span>TAMBAH PRODUK BARU</span>
    </button>
  </div>

  <!-- Search & Filters -->
  <div class="flex items-center space-x-3 bg-white border border-slate-200 p-3 rounded-2xl shadow-sm">
    <Search class="w-5 h-5 text-slate-400 ml-1" />
    <input type="text" bind:value={searchQuery} placeholder="Cari nama produk, SKU, atau scan barcode..." class="bg-transparent text-slate-900 text-sm focus:outline-none w-full placeholder:text-slate-400" />
  </div>

  <!-- Products Table -->
  <div class="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
    <table class="w-full text-left text-xs text-slate-700">
      <thead class="bg-slate-50 text-slate-500 uppercase font-bold border-b border-slate-200">
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
      <tbody class="divide-y divide-slate-100">
        {#each filtered as p}
          <tr class="hover:bg-slate-50">
            <td class="p-3.5 font-bold text-slate-900 flex items-center space-x-3">
              <div class="w-10 h-10 rounded-lg bg-slate-100 overflow-hidden flex items-center justify-center border border-slate-200">
                {#if p.imageUrl}
                  <img src={p.imageUrl} alt={p.name} class="w-full h-full object-cover" />
                {:else}
                  <Package class="w-5 h-5 text-slate-400" />
                {/if}
              </div>
              <div>
                <p class="font-bold text-slate-900">{p.name}</p>
                <span class="text-[10px] text-slate-500 font-mono">{p.unit}</span>
              </div>
            </td>
            <td class="p-3.5 font-mono text-slate-700">
              <div class="flex items-center space-x-1 text-sky-700 font-bold">
                <Barcode class="w-4 h-4" />
                <span>{p.barcode}</span>
              </div>
              <span class="text-[10px] text-slate-400">{p.sku}</span>
            </td>
            <td class="p-3.5"><span class="px-2.5 py-1 bg-slate-100 text-slate-700 rounded-full font-mono text-[10px] border border-slate-200">{p.category}</span></td>
            <td class="p-3.5 text-right font-mono text-slate-500">{formatRp(p.costPrice)}</td>
            <td class="p-3.5 text-right font-mono text-emerald-700 font-bold">{formatRp(p.sellPrice)}</td>
            <td class="p-3.5 text-center font-bold font-mono"><span class="px-2.5 py-1 rounded-lg bg-sky-50 text-sky-700 border border-sky-100">{p.stock}</span></td>
            <td class="p-3.5 text-center space-x-2">
              <button on:click={() => { editingId = p.id; form = { ...p }; showModal = true; }} class="p-1.5 bg-slate-100 hover:bg-slate-200 text-sky-700 rounded-lg border border-slate-200">
                <Edit3 class="w-4 h-4" />
              </button>
              <button on:click={() => deleteProduct(p.id)} class="p-1.5 bg-slate-100 hover:bg-slate-200 text-red-600 rounded-lg border border-slate-200">
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
  <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 rounded-3xl max-w-lg w-full p-6 space-y-4 shadow-2xl">
      <div class="flex justify-between items-center border-b border-slate-200 pb-3">
        <h3 class="text-base font-bold text-slate-900">{editingId ? 'Edit Produk' : 'Tambah Produk Baru'}</h3>
        <button on:click={() => showModal = false} class="text-slate-400 hover:text-slate-700"><X class="w-5 h-5" /></button>
      </div>

      <div class="space-y-3 text-xs">
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-slate-600 font-bold">Barcode</label>
            <input type="text" bind:value={form.barcode} class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1 font-mono" />
          </div>
          <div>
            <label class="text-slate-600 font-bold">Kode SKU</label>
            <input type="text" bind:value={form.sku} on:input={() => isSkuTouched = true} placeholder="Otomatis dari nama produk" class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1 font-mono uppercase" />
          </div>
        </div>
        <div>
          <label class="text-slate-600 font-bold">Nama Produk</label>
          <input type="text" bind:value={form.name} on:input={handleNameInput} placeholder="Contoh: Indomie Goreng Spesial 85g" class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1" />
        </div>
        <div>
          <label class="text-slate-600 font-bold">Kategori</label>
          <select bind:value={form.categoryId} on:change={handleCategoryChange} class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1">
            {#each categories as cat}
              <option value={cat.id}>{cat.code} — {cat.name}</option>
            {/each}

        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-slate-600 font-bold">Harga Modal (HPP)</label>
            <input type="number" bind:value={form.costPrice} class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1" />
          </div>
          <div>
            <label class="text-slate-600 font-bold">Harga Jual</label>
            <input type="number" bind:value={form.sellPrice} class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1" />
          </div>
        </div>
        <div class="grid grid-cols-2 gap-2">
          <div>
            <label class="text-slate-600 font-bold">Stok Awal</label>
            <input type="number" bind:value={form.stock} class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1" />
          </div>
          <div>
            <label class="text-slate-600 font-bold">Satuan (Unit)</label>
            <input type="text" bind:value={form.unit} class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1" />
          </div>
        </div>
        <div>
          <label class="text-slate-600 font-bold">Foto Produk (Opsional)</label>
          <div class="mt-1 flex items-center gap-3">
            <!-- Preview -->
            <div class="w-16 h-16 rounded-xl bg-slate-100 border border-slate-200 overflow-hidden flex items-center justify-center flex-shrink-0">
              {#if form.imageUrl}
                <img src={form.imageUrl} alt="preview" class="w-full h-full object-cover" />
              {:else}
                <Package class="w-6 h-6 text-slate-300" />
              {/if}
            </div>
            <!-- Upload button -->
            <div class="flex-1">
              <label class="cursor-pointer flex items-center justify-center gap-2 px-3 py-2 border-2 border-dashed border-slate-300 hover:border-sky-400 rounded-xl text-slate-500 hover:text-sky-600 transition-colors {isUploading ? 'opacity-50 pointer-events-none' : ''}">
                {#if isUploading}
                  <span class="inline-block w-4 h-4 border-2 border-sky-500 border-t-transparent rounded-full animate-spin"></span>
                  <span class="text-xs">Mengupload...</span>
                {:else}
                  <Upload class="w-4 h-4" />
                  <span class="text-xs font-bold">{form.imageUrl ? 'Ganti Foto' : 'Upload Foto'}</span>
                {/if}
                <input type="file" accept="image/jpeg,image/png,image/webp" class="hidden" on:change={handleFileSelect} />
              </label>
              <p class="text-[10px] text-slate-400 mt-1">JPG, PNG, WEBP · Maks. 2MB</p>
              {#if uploadError}
                <p class="text-[10px] text-red-500 mt-1">{uploadError}</p>
              {/if}
              {#if form.imageUrl}
                <button type="button" on:click={() => form.imageUrl = ''} class="text-[10px] text-red-400 hover:text-red-600 mt-1">Hapus foto</button>
              {/if}
            </div>
          </div>
        </div>
      </div>

      <button on:click={saveProduct} disabled={isSaving || isUploading} class="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md shadow-sky-600/20">
        {isSaving ? 'MENYIMPAN...' : 'SIMPAN PRODUK'}
      </button>
    </div>
  </div>
{/if}
