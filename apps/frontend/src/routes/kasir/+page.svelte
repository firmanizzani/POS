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
    shiftStore
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

  // Full Minimarket Database
  const products = [
    // Mie & Makanan Instan
    { id: 'prod-101', barcode: '8991000000101', name: 'Indomie Goreng Spesial 85g', category: 'Mie & Makanan Instan', sellPrice: 3500, stock: 200, image: '🍜' },
    { id: 'prod-102', barcode: '8991000000102', name: 'Indomie Kuah Rasa Ayam Bawang 75g', category: 'Mie & Makanan Instan', sellPrice: 3400, stock: 150, image: '🍜' },
    { id: 'prod-103', barcode: '8991000000103', name: 'Indomie Kuah Rasa Soto Mie 70g', category: 'Mie & Makanan Instan', sellPrice: 3400, stock: 150, image: '🍜' },
    { id: 'prod-104', barcode: '8991000000104', name: 'Mie Sedaap Goreng 90g', category: 'Mie & Makanan Instan', sellPrice: 3500, stock: 120, image: '🍜' },
    { id: 'prod-105', barcode: '8991000000105', name: 'Pop Mie Rasa Ayam 75g', category: 'Mie & Makanan Instan', sellPrice: 5500, stock: 60, image: '🍜' },
    { id: 'prod-106', barcode: '8991000000106', name: 'Samyang Buldak Carbonara 130g', category: 'Mie & Makanan Instan', sellPrice: 22500, stock: 30, image: '🍜' },

    // Biskuit & Roti
    { id: 'prod-107', barcode: '8991000000107', name: 'Oreo Vanilla 133g', category: 'Biskuit & Roti', sellPrice: 9500, stock: 50, image: '🍪' },
    { id: 'prod-108', barcode: '8991000000108', name: 'Roma Kelapa 300g', category: 'Biskuit & Roti', sellPrice: 11500, stock: 40, image: '🍞' },
    { id: 'prod-109', barcode: '8991000000109', name: 'Khong Guan Red Assorted Biscuit 300g', category: 'Biskuit & Roti', sellPrice: 49000, stock: 15, image: '🍪' },
    { id: 'prod-110', barcode: '8991000000110', name: 'Tango Wafer Cokelat 130g', category: 'Biskuit & Roti', sellPrice: 8000, stock: 45, image: '🍫' },

    // Camilan & Snack
    { id: 'prod-112', barcode: '8991000000112', name: 'Chitato Sapi Panggang 68g', category: 'Camilan & Snack', sellPrice: 11500, stock: 50, image: '🥔' },
    { id: 'prod-113', barcode: '8991000000113', name: 'Chitato Lite Rumput Laut 68g', category: 'Camilan & Snack', sellPrice: 11500, stock: 40, image: '🥔' },
    { id: 'prod-114', barcode: '8991000000114', name: 'Silverqueen Milk Chocolate 58g', category: 'Camilan & Snack', sellPrice: 16000, stock: 35, image: '🍫' },
    { id: 'prod-115', barcode: '8991000000115', name: 'Kusuka Keripik Singkong Balado 180g', category: 'Camilan & Snack', sellPrice: 14000, stock: 30, image: '🥔' },

    // Air Mineral & Isotonik
    { id: 'prod-117', barcode: '8991000000117', name: 'Le Minerale 600ml', category: 'Air Mineral & Isotonik', sellPrice: 3500, stock: 120, image: '💧' },
    { id: 'prod-118', barcode: '8991000000118', name: 'Aqua Air Mineral 600ml', category: 'Air Mineral & Isotonik', sellPrice: 3800, stock: 120, image: '💧' },
    { id: 'prod-119', barcode: '8991000000119', name: 'Aqua Air Mineral 1500ml', category: 'Air Mineral & Isotonik', sellPrice: 7000, stock: 60, image: '💧' },
    { id: 'prod-120', barcode: '8991000000120', name: 'Pocari Sweat 500ml', category: 'Air Mineral & Isotonik', sellPrice: 8500, stock: 48, image: '⚡' },

    // Minuman Kemasan & Susu
    { id: 'prod-122', barcode: '8991000000122', name: 'Teh Botol Sosro 450ml', category: 'Minuman Kemasan & Susu', sellPrice: 5500, stock: 80, image: '🧃' },
    { id: 'prod-123', barcode: '8991000000123', name: 'Ultra Milk Cokelat 250ml', category: 'Minuman Kemasan & Susu', sellPrice: 7000, stock: 60, image: '🥛' },
    { id: 'prod-124', barcode: '8991000000124', name: 'Ultra Milk Full Cream 1000ml', category: 'Minuman Kemasan & Susu', sellPrice: 20000, stock: 24, image: '🥛' },
    { id: 'prod-125', barcode: '8991000000125', name: 'Nescafé Original Can 220ml', category: 'Minuman Kemasan & Susu', sellPrice: 8500, stock: 48, image: '☕' },

    // Bumbu & Kebutuhan Dapur
    { id: 'prod-128', barcode: '8991000000128', name: 'Minyak Goreng Bimoli 1L', category: 'Bumbu & Kebutuhan Dapur', sellPrice: 19500, stock: 30, image: '🍾' },
    { id: 'prod-129', barcode: '8991000000129', name: 'Minyak Goreng Sania 2L', category: 'Bumbu & Kebutuhan Dapur', sellPrice: 37000, stock: 20, image: '🍾' },
    { id: 'prod-130', barcode: '8991000000130', name: 'Gula Pasir Gulaku Premium 1kg', category: 'Bumbu & Kebutuhan Dapur', sellPrice: 17500, stock: 40, image: '🍚' },

    // Sabun & Kebersihan
    { id: 'prod-135', barcode: '8991000000135', name: 'Lifebuoy Sabun Mandi Red 110g', category: 'Sabun & Perawatan Tubuh', sellPrice: 5000, stock: 50, image: '🧼' },
    { id: 'prod-141', barcode: '8991000000141', name: 'Rinso Anti Noda Deterjen Powder 770g', category: 'Kebutuhan Kebersihan Rumah', sellPrice: 24000, stock: 25, image: '🧺' },
    { id: 'prod-142', barcode: '8991000000142', name: 'Mama Lemon Pencuci Piring Pouch 680ml', category: 'Kebutuhan Kebersihan Rumah', sellPrice: 11500, stock: 30, image: '🍋' }
  ];

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

  function processPayment() {
    if (paidAmount < $grandTotal) {
      alert('Jumlah pembayaran kurang dari total belanja!');
      return;
    }

    lastCompletedTransaction = {
      invoiceNumber: `INV-${Date.now().toString().slice(-6)}`,
      cashierName: $shiftStore.cashierName,
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
  }

  function printReceipt() {
    window.print();
  }

  function formatRp(val: number) {
    return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(val);
  }
</script>

<div class="flex-1 flex overflow-hidden bg-slate-50">
  <!-- LEFT: Tap-Tap Product Catalog & Barcode Search (Light Theme) -->
  <div class="flex-1 flex flex-col border-r border-slate-200 p-4 space-y-4 overflow-hidden bg-slate-50">
    <!-- Top Search & Barcode Bar -->
    <div class="flex items-center space-x-3">
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
    <div class="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
      {#each categories as cat}
        <button
          on:click={() => (selectedCategory = cat)}
          class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all {selectedCategory === cat ? 'bg-sky-600 text-white shadow-md shadow-sky-600/20' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'}"
        >
          {cat}
        </button>
      {/each}
    </div>

    <!-- Product Tap-Tap Grid -->
    <div class="flex-1 overflow-y-auto grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 pr-1">
      {#each filteredProducts as p}
        <button
          on:click={() => addToCart(p)}
          class="bg-white hover:bg-sky-50/50 border border-slate-200 hover:border-sky-400 p-3.5 rounded-2xl flex flex-col justify-between text-left transition-all group relative shadow-sm hover:shadow-md active:scale-95"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-3xl">{p.image}</span>
            <span class="text-[10px] bg-slate-100 text-slate-600 font-mono px-2 py-0.5 rounded-full border border-slate-200">{p.category}</span>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-slate-800 line-clamp-2 mb-1 group-hover:text-sky-600 transition-colors">{p.name}</h3>
            <p class="text-xs text-slate-500 font-mono mb-2">Stok: {p.stock}</p>
          </div>

          <div class="flex items-center justify-between border-t border-slate-100 pt-2 mt-1">
            <span class="text-sm font-bold text-sky-700">{formatRp(p.sellPrice)}</span>
            <div class="bg-sky-50 text-sky-600 p-1.5 rounded-xl group-hover:bg-sky-600 group-hover:text-white transition-colors">
              <Plus class="w-4 h-4" />
            </div>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- RIGHT: Cart, Actions & Checkout Panel (Light Theme) -->
  <div class="w-[420px] bg-white flex flex-col justify-between p-4 space-y-4 border-l border-slate-200 shadow-sm">
    <!-- Header Actions (Hold & Shift) -->
    <div class="flex items-center justify-between border-b border-slate-200 pb-3">
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

    <!-- Cart Item List -->
    <div class="flex-1 overflow-y-auto space-y-2 pr-1">
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

    <!-- Summary & Checkout Footer -->
    <div class="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-sm">
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
