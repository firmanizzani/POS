<script lang="ts">
  import { onMount } from 'svelte';
  import {
    cartItems,
    addToCart,
    updateQuantity,
    clearCart,
    holdCurrentCart,
    resumeCart,
    heldCartsStore,
    subtotal,
    discountTotal,
    grandTotal,
    shiftStore,
    appliedPromo
  } from '$lib/stores/posStore';
  import ThermalReceipt from '$lib/components/ThermalReceipt.svelte';
  import {
    Search,
    Barcode,
    Plus,
    Minus,
    Trash2,
    PauseCircle,
    PlayCircle,
    CreditCard,
    DollarSign,
    QrCode,
    Printer,
    Clock,
    UserCheck,
    Tag,
    X,
    CheckCircle2
  } from 'lucide-svelte';

  let searchQuery = '';
  let selectedCategory = 'All';
  let barcodeInput = '';
  let showPaymentModal = false;
  let showHoldModal = false;
  let showShiftModal = false;
  let showReceiptModal = false;

  let paidAmount = 0;
  let paymentMethod = 'CASH';
  let holdLabel = '';

  let lastCompletedTransaction: any = null;

  // Member & Loyalty State
  let members: any[] = [];
  let selectedMemberId: string = '';
  let showAddMemberModal = false;
  let newMemberForm = { name: '', phone: '' };
  let isRegisteringMember = false;

  $: selectedMember = members.find((m) => m.id === selectedMemberId);
  $: earnedPoints = $grandTotal > 0 ? Math.floor($grandTotal / 1000) : 0;

  // Promo Code State
  let promoInput = '';
  let promos: any[] = [];

  async function applyPromoCode() {
    if (!promoInput) return;
    const codeUpper = promoInput.trim().toUpperCase();

    let found = promos.find((p) => p.code.toUpperCase() === codeUpper && p.status === 'ACTIVE');

    if (!found) {
      try {
        const res = await fetch('/api/promos').then((r) => r.json());
        if (res?.success && Array.isArray(res.data)) {
          promos = res.data;
          found = promos.find((p: any) => p.code.toUpperCase() === codeUpper && p.status === 'ACTIVE');
        }
      } catch (e) {}
    }

    if (!found) {
      alert('Kode promo tidak valid atau tidak ditemukan!');
      return;
    }

    if ($subtotal < (found.minPurchase || 0)) {
      alert(`Minimal belanja untuk promo ini adalah ${formatRp(found.minPurchase)}`);
      return;
    }

    const isPercent = found.value.includes('%') || found.type === 'PERCENTAGE';
    const numericVal = Number(found.value.replace(/[^0-9]/g, '')) || 0;

    appliedPromo.set({
      code: found.code,
      title: found.title,
      type: isPercent ? 'percentage' : 'fixed',
      value: numericVal
    });

    promoInput = '';
  }

  function removePromo() {
    appliedPromo.set(null);
  }

  interface ProductItem {
    id: string;
    barcode: string;
    name: string;
    category: string;
    sellPrice: number;
    stock: number;
    image?: string;
    imageUrl?: string;
  }

  import { api } from '$lib/api/eden';

  // Full Minimarket Database (Default + Fetched from Neon API)
  let products: ProductItem[] = [
    // Mie & Makanan Instan (cat-1)
    { id: 'prod-101', barcode: '8991000000101', name: 'Indomie Goreng Spesial 85g', category: 'Mie & Makanan Instan', sellPrice: 3500, stock: 200, image: '🍜' },
    { id: 'prod-102', barcode: '8991000000102', name: 'Indomie Kuah Rasa Ayam Bawang 75g', category: 'Mie & Makanan Instan', sellPrice: 3400, stock: 150, image: '🍜' },
    { id: 'prod-103', barcode: '8991000000103', name: 'Indomie Kuah Rasa Soto Mie 70g', category: 'Mie & Makanan Instan', sellPrice: 3400, stock: 150, image: '🍜' },
    { id: 'prod-104', barcode: '8991000000104', name: 'Mie Sedaap Goreng 90g', category: 'Mie & Makanan Instan', sellPrice: 3500, stock: 120, image: '🍜' },
    { id: 'prod-105', barcode: '8991000000105', name: 'Pop Mie Rasa Ayam 75g', category: 'Mie & Makanan Instan', sellPrice: 5500, stock: 60, image: '🍜' },
    { id: 'prod-106', barcode: '8991000000106', name: 'Samyang Buldak Carbonara 130g', category: 'Mie & Makanan Instan', sellPrice: 22500, stock: 30, image: '🍜' },

    // Biskuit & Roti (cat-2)
    { id: 'prod-107', barcode: '8991000000107', name: 'Oreo Vanilla 133g', category: 'Biskuit & Roti', sellPrice: 9500, stock: 50, image: '🍪' },
    { id: 'prod-108', barcode: '8991000000108', name: 'Roma Kelapa 300g', category: 'Biskuit & Roti', sellPrice: 11500, stock: 40, image: '🍞' },
    { id: 'prod-109', barcode: '8991000000109', name: 'Khong Guan Red Assorted Biscuit 300g', category: 'Biskuit & Roti', sellPrice: 49000, stock: 15, image: '🍪' },
    { id: 'prod-110', barcode: '8991000000110', name: 'Tango Wafer Cokelat 130g', category: 'Biskuit & Roti', sellPrice: 8000, stock: 45, image: '🍫' },
    { id: 'prod-111', barcode: '8991000000111', name: 'Good Time Double Choc 72g', category: 'Biskuit & Roti', sellPrice: 7500, stock: 40, image: '🍪' },

    // Camilan & Snack (cat-3)
    { id: 'prod-112', barcode: '8991000000112', name: 'Chitato Sapi Panggang 68g', category: 'Camilan & Snack', sellPrice: 11500, stock: 50, image: '🥔' },
    { id: 'prod-113', barcode: '8991000000113', name: 'Chitato Lite Rumput Laut 68g', category: 'Camilan & Snack', sellPrice: 11500, stock: 40, image: '🥔' },
    { id: 'prod-114', barcode: '8991000000114', name: 'Silverqueen Milk Chocolate 58g', category: 'Camilan & Snack', sellPrice: 16000, stock: 35, image: '🍫' },
    { id: 'prod-115', barcode: '8991000000115', name: 'Kusuka Keripik Singkong Balado 180g', category: 'Camilan & Snack', sellPrice: 14000, stock: 30, image: '🥔' },
    { id: 'prod-116', barcode: '8991000000116', name: 'Beng-Beng Wafer Caramel 20g Pack', category: 'Camilan & Snack', sellPrice: 40000, stock: 20, image: '🍫' },

    // Air Mineral & Isotonik (cat-4)
    { id: 'prod-117', barcode: '8991000000117', name: 'Le Minerale 600ml', category: 'Air Mineral & Isotonik', sellPrice: 3500, stock: 120, image: '💧' },
    { id: 'prod-118', barcode: '8991000000118', name: 'Aqua Air Mineral 600ml', category: 'Air Mineral & Isotonik', sellPrice: 3800, stock: 120, image: '💧' },
    { id: 'prod-119', barcode: '8991000000119', name: 'Aqua Air Mineral 1500ml', category: 'Air Mineral & Isotonik', sellPrice: 7000, stock: 60, image: '💧' },
    { id: 'prod-120', barcode: '8991000000120', name: 'Pocari Sweat 500ml', category: 'Air Mineral & Isotonik', sellPrice: 8500, stock: 48, image: '⚡' },
    { id: 'prod-121', barcode: '8991000000121', name: 'Mizone Apple Guava 500ml', category: 'Air Mineral & Isotonik', sellPrice: 5000, stock: 36, image: '⚡' },

    // Minuman Kemasan & Susu (cat-5)
    { id: 'prod-122', barcode: '8991000000122', name: 'Teh Botol Sosro 450ml', category: 'Minuman Kemasan & Susu', sellPrice: 5500, stock: 80, image: '🧃' },
    { id: 'prod-123', barcode: '8991000000123', name: 'Ultra Milk Cokelat 250ml', category: 'Minuman Kemasan & Susu', sellPrice: 7000, stock: 60, image: '🥛' },
    { id: 'prod-124', barcode: '8991000000124', name: 'Ultra Milk Full Cream 1000ml', category: 'Minuman Kemasan & Susu', sellPrice: 20000, stock: 24, image: '🥛' },
    { id: 'prod-125', barcode: '8991000000125', name: 'Nescafé Original Can 220ml', category: 'Minuman Kemasan & Susu', sellPrice: 8500, stock: 48, image: '☕' },
    { id: 'prod-126', barcode: '8991000000126', name: 'Cimory Yogurt Drink Blueberry 240ml', category: 'Minuman Kemasan & Susu', sellPrice: 9500, stock: 30, image: '🥛' },
    { id: 'prod-127', barcode: '8991000000127', name: 'Coca-Cola 390ml', category: 'Minuman Kemasan & Susu', sellPrice: 5500, stock: 60, image: '🥤' },

    // Bumbu & Kebutuhan Dapur (cat-6)
    { id: 'prod-128', barcode: '8991000000128', name: 'Minyak Goreng Bimoli 1L', category: 'Bumbu & Kebutuhan Dapur', sellPrice: 19500, stock: 30, image: '🍾' },
    { id: 'prod-129', barcode: '8991000000129', name: 'Minyak Goreng Sania 2L', category: 'Bumbu & Kebutuhan Dapur', sellPrice: 37000, stock: 20, image: '🍾' },
    { id: 'prod-130', barcode: '8991000000130', name: 'Gula Pasir Gulaku Premium 1kg', category: 'Bumbu & Kebutuhan Dapur', sellPrice: 17500, stock: 40, image: '🍚' },
    { id: 'prod-131', barcode: '8991000000131', name: 'Garam Dapur Cap Kapal 250g', category: 'Bumbu & Kebutuhan Dapur', sellPrice: 3000, stock: 50, image: '🧂' },
    { id: 'prod-132', barcode: '8991000000132', name: 'Royco Rasa Ayam 230g', category: 'Bumbu & Kebutuhan Dapur', sellPrice: 10000, stock: 35, image: '🍲' },
    { id: 'prod-133', barcode: '8991000000133', name: 'ABC Kecap Manis Refill 520ml', category: 'Bumbu & Kebutuhan Dapur', sellPrice: 19500, stock: 25, image: '🍾' },
    { id: 'prod-134', barcode: '8991000000134', name: 'Sasa Tepung Bumbu Serbaguna 200g', category: 'Bumbu & Kebutuhan Dapur', sellPrice: 6500, stock: 40, image: '🌾' },

    // Sabun & Perawatan Tubuh (cat-7)
    { id: 'prod-135', barcode: '8991000000135', name: 'Lifebuoy Sabun Mandi Red 110g', category: 'Sabun & Perawatan Tubuh', sellPrice: 5000, stock: 50, image: '🧼' },
    { id: 'prod-136', barcode: '8991000000136', name: 'Biore Body Wash Pouch 450ml', category: 'Sabun & Perawatan Tubuh', sellPrice: 26000, stock: 20, image: '🧴' },
    { id: 'prod-137', barcode: '8991000000137', name: 'Pantene Shampoo Anti Dandruff 160ml', category: 'Sabun & Perawatan Tubuh', sellPrice: 27500, stock: 20, image: '🧴' },
    { id: 'prod-138', barcode: '8991000000138', name: 'Pepsodent Complete 124 190g', category: 'Sabun & Perawatan Tubuh', sellPrice: 13500, stock: 30, image: '🪥' },
    { id: 'prod-139', barcode: '8991000000139', name: 'Formula Sikat Gigi Double Action', category: 'Sabun & Perawatan Tubuh', sellPrice: 6000, stock: 40, image: '🪥' },
    { id: 'prod-140', barcode: '8991000000140', name: 'Rexona Roll On Women Passion 45ml', category: 'Sabun & Perawatan Tubuh', sellPrice: 21500, stock: 15, image: '✨' },

    // Kebutuhan Kebersihan Rumah (cat-8)
    { id: 'prod-141', barcode: '8991000000141', name: 'Rinso Anti Noda Deterjen Powder 770g', category: 'Kebutuhan Kebersihan Rumah', sellPrice: 24000, stock: 25, image: '🧺' },
    { id: 'prod-142', barcode: '8991000000142', name: 'Mama Lemon Pencuci Piring Pouch 680ml', category: 'Kebutuhan Kebersihan Rumah', sellPrice: 11500, stock: 30, image: '🍋' },
    { id: 'prod-143', barcode: '8991000000143', name: 'So Klin Pembersih Lantai Citrus 780ml', category: 'Kebutuhan Kebersihan Rumah', sellPrice: 13000, stock: 25, image: '🧹' },
    { id: 'prod-144', barcode: '8991000000144', name: 'Baygon Aerosol Tea Blossom 600ml', category: 'Kebutuhan Kebersihan Rumah', sellPrice: 41000, stock: 15, image: '🦟' },

    // Kebutuhan Ibu & Bayi (cat-9)
    { id: 'prod-145', barcode: '8991000000145', name: 'MamyPoko Pants Standard M34', category: 'Kebutuhan Ibu & Bayi', sellPrice: 62000, stock: 15, image: '👶' },
    { id: 'prod-146', barcode: '8991000000146', name: 'My Baby Minyak Telon Plus 90ml', category: 'Kebutuhan Ibu & Bayi', sellPrice: 23500, stock: 20, image: '🍼' },
    { id: 'prod-147', barcode: '8991000000147', name: 'Cussons Baby Wipes Sensitive 50s', category: 'Kebutuhan Ibu & Bayi', sellPrice: 16500, stock: 25, image: '🧻' },

    // Perlengkapan Rumah Tangga (cat-10)
    { id: 'prod-148', barcode: '8991000000148', name: 'Tissue Paseo Soft Pack 250s', category: 'Perlengkapan Rumah Tangga', sellPrice: 14000, stock: 40, image: '🧻' },
    { id: 'prod-149', barcode: '8991000000149', name: 'Baterai ABC Alkaline AA Pack/2', category: 'Perlengkapan Rumah Tangga', sellPrice: 14500, stock: 30, image: '🔋' },
    { id: 'prod-150', barcode: '8991000000150', name: 'Korek Api Gas Tokai', category: 'Perlengkapan Rumah Tangga', sellPrice: 4000, stock: 100, image: '🔥' }
  ];

  onMount(async () => {
    try {
      const res = await fetch('/api/products').then(r => r.json());
      if (res?.success && Array.isArray(res.data) && res.data.length > 0) {
        products = res.data.map((p: any) => ({
          id: p.id,
          barcode: p.barcode,
          name: p.name,
          category: p.categoryName || 'Lainnya',
          sellPrice: Number(p.sellPrice),
          stock: Number(p.stock),
          image: '🛒',
          imageUrl: p.imageUrl
        }));
      }
    } catch (e) {
      console.warn('Using default product list', e);
    }

    try {
      const resM = await fetch('/api/members').then(r => r.json());
      if (resM?.success && Array.isArray(resM.data)) {
        members = resM.data;
      }
    } catch (e) {
      console.warn('Failed to load members', e);
    }

    try {
      const resP = await fetch('/api/promos').then(r => r.json());
      if (resP?.success && Array.isArray(resP.data)) {
        promos = resP.data;
      }
    } catch (e) {
      console.warn('Failed to load promos', e);
    }
  });

  async function registerQuickMember() {
    if (!newMemberForm.name || !newMemberForm.phone) {
      alert('Nama & No. HP wajib diisi!');
      return;
    }
    isRegisteringMember = true;
    try {
      const res = await fetch('/api/members', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMemberForm)
      }).then(r => r.json());

      if (res?.success && res.data) {
        members = [res.data, ...members];
        selectedMemberId = res.data.id;
        showAddMemberModal = false;
        newMemberForm = { name: '', phone: '' };
      } else {
        alert('Gagal mendaftar member: ' + (res?.message || 'Error'));
      }
    } catch (e: any) {
      alert('Error: ' + e.message);
    } finally {
      isRegisteringMember = false;
    }
  }

  const categories = [
    'All',
    'Mie & Makanan Instan',
    'Biskuit & Roti',
    'Camilan & Snack',
    'Air Mineral & Isotonik',
    'Minuman Kemasan & Susu',
    'Bumbu & Kebutuhan Dapur',
    'Sabun & Perawatan Tubuh',
    'Kebutuhan Kebersihan Rumah',
    'Kebutuhan Ibu & Bayi',
    'Perlengkapan Rumah Tangga'
  ];

  $: filteredProducts = products.filter((p) => {
    const matchCategory = selectedCategory === 'All' || p.category === selectedCategory;
    const matchQuery = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || p.barcode.includes(searchQuery);
    return matchCategory && matchQuery;
  });

  $: changeAmount = Math.max(0, paidAmount - $grandTotal);

  function handleBarcodeSubmit() {
    if (!barcodeInput) return;
    const target = products.find((p) => p.barcode === barcodeInput || p.id === barcodeInput);
    if (target) {
      addToCart(target);
      barcodeInput = '';
    } else {
      alert('Produk dengan barcode tersebut tidak ditemukan!');
    }
  }

  function handleQuickPay(amount: number) {
    paidAmount = amount;
  }

  async function processPayment() {
    if (paidAmount < $grandTotal) {
      alert('Jumlah pembayaran kurang dari total belanja!');
      return;
    }

    const trxEarnedPoints = selectedMember ? earnedPoints : 0;

    // Kirim ke API untuk disimpan ke memoryStore / DB
    try {
      await fetch('/api/cashier/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shiftId: $shiftStore.shiftId || 'shift-1001',
          cashierId: 'user-kasir-1',
          memberId: selectedMember?.id || null,
          promoCode: $appliedPromo?.code || null,
          items: $cartItems.map(i => ({
            id: i.id,
            name: i.name,
            sellPrice: i.sellPrice,
            quantity: i.quantity,
            subtotal: i.sellPrice * i.quantity
          })),
          subtotal: $subtotal,
          discountTotal: $discountTotal,
          grandTotal: $grandTotal,
          paidAmount: paidAmount,
          paymentMethod: paymentMethod,
          earnedPoints: trxEarnedPoints
        })
      });
    } catch (e) {
      console.warn('Gagal simpan transaksi ke API:', e);
    }

    lastCompletedTransaction = {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      cashierName: $shiftStore.cashierName,
      memberName: selectedMember ? `${selectedMember.name} (${selectedMember.code})` : undefined,
      earnedPoints: trxEarnedPoints,
      promoCode: $appliedPromo?.code,
      promoTitle: $appliedPromo?.title,
      items: [...$cartItems],
      subtotal: $subtotal,
      discount: $discountTotal,
      grandTotal: $grandTotal,
      paidAmount: paidAmount,
      changeAmount: changeAmount,
      paymentMethod: paymentMethod,
      timestamp: new Date().toLocaleString('id-ID')
    };

    showPaymentModal = false;
    showReceiptModal = true;
    clearCart();
    paidAmount = 0;
    selectedMemberId = '';
    removePromo();
  }

  function printReceipt() {
    window.print();
  }

  function formatRp(val: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  }
</script>

<div class="flex-1 flex overflow-hidden bg-slate-50 h-full">
  <!-- LEFT: Tap-Tap Product Catalog & Barcode Search (Light Theme) -->
  <div class="flex-1 flex flex-col border-r border-slate-200 p-4 space-y-4 overflow-hidden bg-slate-50 h-full">
    <!-- Top Search & Barcode Bar -->
    <div class="flex items-center space-x-3 shrink-0">
      <div class="relative flex-1">
        <Search class="w-5 h-5 absolute left-3.5 top-3 text-slate-400" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Cari nama produk / ketik barcode..."
          class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-sky-600 focus:ring-2 focus:ring-sky-100 shadow-sm transition-all"
        />
      </div>

      <!-- Barcode Scanner Input -->
      <form on:submit|preventDefault={handleBarcodeSubmit} class="flex items-center space-x-2 bg-white border border-slate-300 rounded-xl px-3 py-1.5 shadow-sm">
        <Barcode class="w-5 h-5 text-sky-600" />
        <input
          type="text"
          bind:value={barcodeInput}
          placeholder="Scan Barcode (Enter)"
          class="bg-transparent text-slate-900 text-sm focus:outline-none w-44 font-mono placeholder:text-slate-400"
        />
      </form>
    </div>

    <!-- Category Filter Tabs -->
    <div class="flex space-x-2 overflow-x-auto pb-1 scrollbar-none shrink-0">
      {#each categories as cat}
        <button
          on:click={() => (selectedCategory = cat)}
          class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all {selectedCategory === cat ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}"
        >
          {cat}
        </button>
      {/each}
    </div>

    <!-- Product Tap-Tap Grid (Scrollable Container) -->
    <div class="flex-1 overflow-y-auto grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5 pr-1 min-h-0">
      {#each filteredProducts as p}
        <button
          on:click={() => addToCart(p)}
          class="bg-white hover:border-sky-500 border border-slate-200 p-2.5 rounded-2xl flex flex-col justify-between text-left transition-all group relative shadow-sm hover:shadow-md active:scale-[0.98] overflow-hidden"
        >
          <!-- Product Image Container -->
          <div class="w-full h-28 bg-slate-100 rounded-xl overflow-hidden relative mb-2.5 flex items-center justify-center border border-slate-100 group-hover:border-sky-100 transition-colors">
            {#if p.imageUrl}
              <img src={p.imageUrl} alt={p.name} class="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
            {:else}
              <span class="text-4xl group-hover:scale-110 transition-transform duration-300">{p.image || '📦'}</span>
            {/if}

            <!-- Overlay Badge: Category -->
            <span class="absolute top-1.5 right-1.5 bg-white/95 backdrop-blur-sm text-slate-700 text-[9px] font-bold px-2 py-0.5 rounded-full border border-slate-200 shadow-sm">
              {p.category}
            </span>

            <!-- Overlay Badge: Stock -->
            <span class="absolute bottom-1.5 left-1.5 text-[9px] font-bold px-2 py-0.5 rounded-full shadow-sm {p.stock <= 5 ? 'bg-red-500 text-white' : 'bg-slate-900/80 text-white'}">
              Stok: {p.stock}
            </span>
          </div>

          <!-- Product Details -->
          <div class="flex-1 flex flex-col justify-between">
            <div>
              <h3 class="text-xs font-bold text-slate-800 line-clamp-2 mb-1 group-hover:text-sky-600 transition-colors leading-snug">{p.name}</h3>
              <p class="text-[10px] text-slate-400 font-mono flex items-center space-x-1 mb-2">
                <Barcode class="w-3 h-3 text-slate-400 shrink-0" />
                <span class="truncate">{p.barcode}</span>
              </p>
            </div>

            <!-- Price & Quick Add Button Footer -->
            <div class="flex items-center justify-between border-t border-slate-100 pt-2 mt-auto">
              <div>
                <span class="text-[10px] text-slate-400 font-semibold block uppercase">Harga Jual</span>
                <span class="text-sm font-black text-sky-700 leading-none">{formatRp(p.sellPrice)}</span>
              </div>
              <div class="bg-sky-600 text-white p-1.5 rounded-xl shadow-md shadow-sky-600/20 group-hover:bg-sky-700 transition-colors">
                <Plus class="w-4 h-4" />
              </div>
            </div>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- RIGHT: Cart, Actions & Checkout Panel (Light Theme) -->
  <div class="w-[420px] bg-white flex flex-col justify-between p-4 space-y-4 border-l border-slate-200 shadow-sm h-full overflow-hidden">
    <!-- Header Actions (Hold & Shift) -->
    <div class="flex items-center justify-between border-b border-slate-200 pb-3 shrink-0">
      <div class="flex items-center space-x-2">
        <span class="text-base font-bold text-slate-900">Keranjang Belanja</span>
        <span class="bg-sky-100 text-sky-700 text-xs px-2.5 py-0.5 rounded-full font-bold">{ $cartItems.length } Item</span>
      </div>

      <div class="flex items-center space-x-2">
        <!-- Shift Modal Button -->
        <button on:click={() => (showShiftModal = true)} class="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-semibold flex items-center space-x-1 shadow-sm">
          <Clock class="w-4 h-4 text-amber-600" />
          <span>Shift</span>
        </button>

        <!-- Hold Carts List Modal -->
        <button on:click={() => (showHoldModal = true)} class="p-2 bg-slate-50 hover:bg-slate-100 text-slate-700 rounded-xl border border-slate-200 text-xs font-semibold flex items-center space-x-1 relative shadow-sm">
          <PauseCircle class="w-4 h-4 text-sky-600" />
          <span>Hold</span>
          {#if $heldCartsStore.length > 0}
            <span class="absolute -top-1 -right-1 bg-amber-500 text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{ $heldCartsStore.length }</span>
          {/if}
        </button>
      </div>
    </div>

    <!-- Cart Item List (Scrollable Area) -->
    <div class="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
      {#if $cartItems.length === 0}
        <div class="h-full flex flex-col items-center justify-center text-center text-slate-400 p-6 space-y-2">
          <Barcode class="w-12 h-12 stroke-[1.5] text-slate-300 animate-pulse" />
          <p class="text-sm font-semibold text-slate-600">Keranjang masih kosong</p>
          <p class="text-xs text-slate-400">Klik produk di katalog atau scan barcode untuk menambah belanjaan</p>
        </div>
      {:else}
        {#each $cartItems as item}
          <div class="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between shadow-sm">
            <div class="flex-1 pr-2">
              <h4 class="text-xs font-bold text-slate-800 line-clamp-1">{item.name}</h4>
              <p class="text-xs text-sky-700 font-bold mt-0.5">{formatRp(item.sellPrice)}</p>
            </div>

            <!-- Qty Stepper -->
            <div class="flex items-center space-x-2">
              <button on:click={() => updateQuantity(item.id, item.quantity - 1)} class="p-1 bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg shadow-sm">
                <Minus class="w-3.5 h-3.5" />
              </button>
              <span class="text-xs font-bold text-slate-900 min-w-[20px] text-center">{item.quantity}</span>
              <button on:click={() => updateQuantity(item.id, item.quantity + 1)} class="p-1 bg-white hover:bg-slate-200 border border-slate-200 text-slate-700 rounded-lg shadow-sm">
                <Plus class="w-3.5 h-3.5" />
              </button>
              <button on:click={() => updateQuantity(item.id, 0)} class="p-1 text-red-500 hover:text-red-700 ml-1">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Summary & Checkout Footer (ALWAYS FIXED AT BOTTOM) -->
    <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm shrink-0">
      <div class="space-y-1.5 text-xs text-slate-600">
        <div class="flex justify-between">
          <span>Subtotal</span>
          <span class="text-slate-900 font-semibold">{formatRp($subtotal)}</span>
        </div>
        {#if $discountTotal > 0}
          <div class="flex justify-between text-amber-600 font-semibold">
            <span>Diskon Promo</span>
            <span>-{formatRp($discountTotal)}</span>
          </div>
        {/if}
        <div class="flex justify-between text-base font-bold text-slate-900 pt-2 border-t border-slate-200">
          <span>TOTAL BAYAR</span>
          <span class="text-sky-700 font-black">{formatRp($grandTotal)}</span>
        </div>
      </div>

      <!-- Member Selector -->
      <div class="pt-2 border-t border-slate-200 space-y-1.5">
        <div class="flex items-center justify-between">
          <label class="text-[11px] font-bold text-slate-700 flex items-center space-x-1">
            <UserCheck class="w-3.5 h-3.5 text-sky-600" />
            <span>Member Loyalitas</span>
          </label>
          <button on:click={() => showAddMemberModal = true} class="text-[10px] text-sky-600 font-bold hover:underline flex items-center space-x-0.5">
            <Plus class="w-3 h-3" />
            <span>Member Baru</span>
          </button>
        </div>
        <select bind:value={selectedMemberId} class="w-full bg-white border border-slate-300 text-slate-800 text-xs rounded-xl px-2.5 py-1.5 focus:outline-none focus:border-sky-600">
          <option value="">-- Non-Member (Umum) --</option>
          {#each members as m}
            <option value={m.id}>{m.name} ({m.code}) - {m.points} pts</option>
          {/each}
        </select>
        {#if selectedMember}
          <div class="flex justify-between items-center bg-amber-50 border border-amber-200 rounded-lg p-2 text-[11px] text-amber-800 font-medium">
            <span>Tier: <strong>{selectedMember.tier || 'BRONZE'}</strong> ({selectedMember.points} pts)</span>
            <span class="text-emerald-700 font-bold">+{earnedPoints} pts</span>
          </div>
        {/if}
      </div>

      <!-- Action Buttons -->
      <div class="grid grid-cols-2 gap-2 pt-1">
        <button
          disabled={$cartItems.length === 0}
          on:click={() => {
            const label = prompt('Masukkan nama/catatan Hold Cart:');
            if (label) holdCurrentCart(label);
          }}
          class="py-2.5 bg-white hover:bg-slate-100 border border-slate-300 disabled:opacity-50 text-slate-700 text-xs font-bold rounded-xl flex items-center justify-center space-x-1 shadow-sm"
        >
          <PauseCircle class="w-4 h-4 text-sky-600" />
          <span>HOLD CART</span>
        </button>

        <button
          disabled={$cartItems.length === 0}
          on:click={() => {
            paidAmount = $grandTotal;
            showPaymentModal = true;
          }}
          class="py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1 shadow-md shadow-emerald-600/20"
        >
          <CreditCard class="w-4 h-4" />
          <span>BAYAR (F8)</span>
        </button>
      </div>
    </div>
  </div>
</div>

<!-- MODAL 1: PAYMENT MODAL (Light Theme) -->
{#if showPaymentModal}
  <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-200 pb-3">
        <h3 class="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <DollarSign class="w-5 h-5 text-emerald-600" />
          <span>Pembayaran Kasir</span>
        </h3>
        <button on:click={() => (showPaymentModal = false)} class="text-slate-400 hover:text-slate-700">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 text-center space-y-1">
        <span class="text-xs text-slate-500 font-semibold uppercase tracking-wider">Total Tagihan</span>
        <div class="text-3xl font-black text-sky-700">{formatRp($grandTotal)}</div>
        {#if $discountTotal > 0}
          <div class="text-xs text-amber-600 font-bold mt-1">Diskon Promo: -{formatRp($discountTotal)} (Subtotal: {formatRp($subtotal)})</div>
        {/if}
      </div>

      <!-- Kode Promo Section -->
      <div class="space-y-1.5">
        <div class="flex items-center justify-between">
          <label class="text-xs font-bold text-slate-600 flex items-center space-x-1">
            <Tag class="w-3.5 h-3.5 text-amber-600" />
            <span>Kode Promo / Kupon Diskon</span>
          </label>
          {#if $appliedPromo}
            <button on:click={removePromo} class="text-[11px] text-red-600 font-bold hover:underline">Hapus Promo</button>
          {/if}
        </div>
        {#if $appliedPromo}
          <div class="flex items-center justify-between bg-amber-50 border border-amber-200 p-2.5 rounded-xl text-xs text-amber-900 font-bold">
            <div class="flex items-center space-x-2">
              <Tag class="w-4 h-4 text-amber-600" />
              <span>{$appliedPromo.code} ({$appliedPromo.title})</span>
            </div>
            <span class="text-emerald-700 font-black">-{formatRp($discountTotal)}</span>
          </div>
        {:else}
          <div class="flex space-x-2">
            <input
              type="text"
              bind:value={promoInput}
              placeholder="Contoh: HEMAT10"
              class="flex-1 bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 text-xs font-mono uppercase focus:outline-none focus:border-sky-600"
            />
            <button on:click={applyPromoCode} class="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-xl shadow-sm">
              PAKAI PROMO
            </button>
          </div>
        {/if}
      </div>

      <!-- Payment Method Selection -->
      <div class="space-y-2">
        <label class="text-xs font-bold text-slate-600">Metode Pembayaran</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            on:click={() => (paymentMethod = 'CASH')}
            class="py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all {paymentMethod === 'CASH' ? 'bg-sky-600 border-sky-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600'}"
          >
            <DollarSign class="w-4 h-4" />
            <span>TUNAI</span>
          </button>
          <button
            on:click={() => (paymentMethod = 'QRIS')}
            class="py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all {paymentMethod === 'QRIS' ? 'bg-sky-600 border-sky-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600'}"
          >
            <QrCode class="w-4 h-4" />
            <span>QRIS</span>
          </button>
          <button
            on:click={() => (paymentMethod = 'DEBIT')}
            class="py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all {paymentMethod === 'DEBIT' ? 'bg-sky-600 border-sky-600 text-white shadow-md' : 'bg-slate-50 border-slate-200 text-slate-600'}"
          >
            <CreditCard class="w-4 h-4" />
            <span>DEBIT</span>
          </button>
        </div>
      </div>

      <!-- Quick Cash Buttons -->
      {#if paymentMethod === 'CASH'}
        <div class="space-y-2">
          <label class="text-xs font-bold text-slate-600">Uang Pas & Quick Cash</label>
          <div class="grid grid-cols-4 gap-2">
            <button on:click={() => handleQuickPay($grandTotal)} class="py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200">Uang Pas</button>
            <button on:click={() => handleQuickPay(20000)} class="py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200">Rp 20.000</button>
            <button on:click={() => handleQuickPay(50000)} class="py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200">Rp 50.000</button>
            <button on:click={() => handleQuickPay(100000)} class="py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-bold rounded-xl border border-slate-200">Rp 100.000</button>
          </div>

          <div class="pt-2">
            <label class="text-xs font-bold text-slate-600">Nominal Diterima (Rp)</label>
            <input
              type="number"
              bind:value={paidAmount}
              class="w-full bg-white border border-slate-300 text-slate-900 text-lg font-mono font-bold rounded-xl px-4 py-2.5 mt-1 focus:outline-none focus:border-sky-600 shadow-sm"
            />
          </div>

          <div class="flex justify-between items-center bg-slate-50 p-3 rounded-xl border border-slate-200 text-sm">
            <span class="text-slate-600 font-semibold">Kembalian</span>
            <span class="text-emerald-600 font-bold text-lg">{formatRp(changeAmount)}</span>
          </div>
        </div>
      {:else if paymentMethod === 'QRIS'}
        <!-- Dynamic QRIS QR Code Display -->
        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-5 text-center flex flex-col items-center justify-center space-y-3">
          <div class="bg-white p-3 rounded-2xl border border-slate-200 shadow-sm">
            <img
              src="https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=00020101021126580014ID.GO.QRIS.WWW01189360091100000000005204581253033605802ID5913POS%20MINIMARKET6007JAKARTA6304ABCD"
              alt="QRIS Code"
              class="w-44 h-44 object-contain"
            />
          </div>
          <div>
            <span class="text-xs font-bold text-slate-700 uppercase tracking-wider block">Scan QRIS Semua Pembayaran</span>
            <p class="text-[11px] text-slate-500 mt-0.5">Gopay, OVO, ShopeePay, DANA, BCA Mobile, Mandiri LIVIN, dll.</p>
          </div>
        </div>
      {:else if paymentMethod === 'DEBIT'}
        <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-center space-y-2">
          <CreditCard class="w-10 h-10 text-sky-600 mx-auto" />
          <p class="text-xs font-bold text-slate-700">Gesek / Dip Kartu pada Mesin EDC</p>
          <p class="text-[11px] text-slate-500">BCA, Mandiri, BRI, BNI, dll.</p>
        </div>
      {/if}

      <button
        on:click={processPayment}
        class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/30 transition-all flex items-center justify-center space-x-2"
      >
        <CheckCircle2 class="w-5 h-5" />
        <span>KONFIRMASI TRANSAKSI</span>
      </button>
    </div>
  </div>
{/if}

<!-- MODAL 2: RECEIPT MODAL -->
{#if showReceiptModal && lastCompletedTransaction}
  <div class="fixed inset-0 bg-slate-900/50 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 rounded-3xl p-6 max-w-md w-full space-y-4 text-center shadow-2xl">
      <div class="text-emerald-600 flex flex-col items-center space-y-1">
        <CheckCircle2 class="w-12 h-12" />
        <h3 class="text-lg font-bold text-slate-900">Transaksi Berhasil!</h3>
      </div>

      <!-- Thermal Printable Receipt Preview -->
      <div class="flex justify-center my-4 overflow-hidden rounded-xl border border-slate-200 shadow-sm">
        <ThermalReceipt
          invoiceNumber={lastCompletedTransaction.invoiceNumber}
          cashierName={lastCompletedTransaction.cashierName}
          memberName={lastCompletedTransaction.memberName}
          earnedPoints={lastCompletedTransaction.earnedPoints}
          promoCode={lastCompletedTransaction.promoCode}
          items={lastCompletedTransaction.items}
          subtotal={lastCompletedTransaction.subtotal}
          discount={lastCompletedTransaction.discount}
          grandTotal={lastCompletedTransaction.grandTotal}
          paidAmount={lastCompletedTransaction.paidAmount}
          changeAmount={lastCompletedTransaction.changeAmount}
          paymentMethod={lastCompletedTransaction.paymentMethod}
        />
      </div>

      <div class="grid grid-cols-2 gap-3 pt-2">
        <button on:click={printReceipt} class="py-2.5 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl flex items-center justify-center space-x-2 shadow-sm">
          <Printer class="w-4 h-4" />
          <span>CETAK STRUK</span>
        </button>
        <button on:click={() => (showReceiptModal = false)} class="py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl border border-slate-200">
          <span>TUTUP</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- MODAL 3: HOLD CARTS DRAWER -->
{#if showHoldModal}
  <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 rounded-3xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
      <div class="flex justify-between items-center border-b border-slate-200 pb-3">
        <h3 class="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <PauseCircle class="w-5 h-5 text-amber-600" />
          <span>Daftar Transaksi Ditunda (Hold)</span>
        </h3>
        <button on:click={() => (showHoldModal = false)} class="text-slate-400 hover:text-slate-700">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="space-y-2 max-h-96 overflow-y-auto">
        {#if $heldCartsStore.length === 0}
          <p class="text-sm text-slate-500 text-center py-6">Tidak ada keranjang yang ditunda.</p>
        {:else}
          {#each $heldCartsStore as hold}
            <div class="bg-slate-50 border border-slate-200 p-3 rounded-xl flex items-center justify-between">
              <div>
                <h4 class="text-sm font-bold text-slate-900">{hold.label}</h4>
                <p class="text-xs text-slate-500">{hold.timestamp} • {hold.items.length} item</p>
              </div>
              <button
                on:click={() => {
                  resumeCart(hold.id);
                  showHoldModal = false;
                }}
                class="px-3 py-1.5 bg-sky-600 hover:bg-sky-700 text-white text-xs font-bold rounded-lg flex items-center space-x-1"
              >
                <PlayCircle class="w-4 h-4" />
                <span>LANJUTKAN</span>
              </button>
            </div>
          {/each}
        {/if}
      </div>
    </div>
  </div>
{/if}

<!-- MODAL 4: CASHIER SHIFT MANAGEMENT -->
{#if showShiftModal}
  <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
      <div class="flex justify-between items-center border-b border-slate-200 pb-3">
        <h3 class="text-lg font-bold text-slate-900 flex items-center space-x-2">
          <Clock class="w-5 h-5 text-sky-600" />
          <span>Manajemen Shift Kasir</span>
        </h3>
        <button on:click={() => (showShiftModal = false)} class="text-slate-400 hover:text-slate-700">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs text-slate-700">
        <div class="flex justify-between">
          <span>Kasir Aktif:</span>
          <span class="font-bold text-slate-900">{$shiftStore.cashierName}</span>
        </div>
        <div class="flex justify-between">
          <span>Kas Awal Laci:</span>
          <span class="font-bold text-emerald-600">{formatRp($shiftStore.startingCash)}</span>
        </div>
        <div class="flex justify-between">
          <span>Waktu Clock-In:</span>
          <span class="font-mono text-slate-500">{new Date($shiftStore.clockInTime || '').toLocaleTimeString('id-ID')}</span>
        </div>
      </div>

      <div class="space-y-3 pt-2">
        <h4 class="text-xs font-bold text-slate-500 uppercase tracking-wider">Rekap & Clock-Out Laci</h4>
        <input type="number" placeholder="Masukkan total uang fisik di laci (Rp)" class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-600" />
        <button
          on:click={() => {
            alert('Shift berhasil ditutup dan rekap kasir telah dicetak!');
            showShiftModal = false;
          }}
          class="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md shadow-red-600/20"
        >
          CLOCK-OUT & CETAK REKAP LACI
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- MODAL 5: QUICK MEMBER REGISTRATION -->
{#if showAddMemberModal}
  <div class="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-white border border-slate-200 rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
      <div class="flex justify-between items-center border-b border-slate-200 pb-3">
        <h3 class="text-base font-bold text-slate-900 flex items-center space-x-2">
          <UserCheck class="w-5 h-5 text-sky-600" />
          <span>Registrasi Member Baru</span>
        </h3>
        <button on:click={() => showAddMemberModal = false} class="text-slate-400 hover:text-slate-700">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="space-y-3 text-xs">
        <div>
          <label class="text-slate-600 font-bold">Nama Lengkap Member</label>
          <input type="text" bind:value={newMemberForm.name} placeholder="Contoh: Budi Santoso" class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1 focus:outline-none focus:border-sky-600" />
        </div>
        <div>
          <label class="text-slate-600 font-bold">No. Telepon / WhatsApp</label>
          <input type="text" bind:value={newMemberForm.phone} placeholder="081234567890" class="w-full bg-white border border-slate-300 text-slate-900 rounded-xl px-3 py-2 mt-1 font-mono focus:outline-none focus:border-sky-600" />
        </div>
      </div>

      <button on:click={registerQuickMember} disabled={isRegisteringMember} class="w-full py-3 bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold rounded-xl text-xs uppercase tracking-wider shadow-md shadow-sky-600/20">
        {isRegisteringMember ? 'MENDAFTARKAN...' : 'DAFTARKAN & PILIH MEMBER'}
      </button>
    </div>
  </div>
{/if}
