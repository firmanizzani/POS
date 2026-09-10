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

  // Mock Products Database
  const products = [
    { id: 'prod-1', barcode: '899100110011', name: 'Indomie Goreng Original 85g', category: 'Makanan', sellPrice: 3200, stock: 120, image: '🍜' },
    { id: 'prod-2', barcode: '899200220022', name: 'Air Mineral Aqua 600ml', category: 'Minuman', sellPrice: 3500, stock: 85, image: '💧' },
    { id: 'prod-3', barcode: '899300330033', name: 'Milo Powder 3in1 20g', category: 'Minuman', sellPrice: 3000, stock: 45, image: '☕' },
    { id: 'prod-4', barcode: '899400440044', name: 'Chitato Sapi Panggang 68g', category: 'Snack', sellPrice: 11000, stock: 30, image: '🥔' },
    { id: 'prod-5', barcode: '899500550055', name: 'Teh Botol Sosro 450ml', category: 'Minuman', sellPrice: 5000, stock: 60, image: '🧃' },
    { id: 'prod-6', barcode: '899600660066', name: 'Roti Tawar Kupas Sari Roti', category: 'Makanan', sellPrice: 16000, stock: 15, image: '🍞' },
    { id: 'prod-7', barcode: '899700770077', name: 'Sabun Lifebuoy Red 110g', category: 'Personal Care', sellPrice: 4500, stock: 40, image: '🧼' },
    { id: 'prod-8', barcode: '899800880088', name: 'Pepsodent Soft 190g', category: 'Personal Care', sellPrice: 12500, stock: 25, image: '🪥' }
  ];

  const categories = ['All', 'Makanan', 'Minuman', 'Snack', 'Personal Care'];

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

<div class="flex-1 flex overflow-hidden">
  <!-- LEFT: Tap-Tap Product Catalog & Barcode Search -->
  <div class="flex-1 flex flex-col border-r border-slate-800 p-4 space-y-4 overflow-hidden">
    <!-- Top Search & Barcode Bar -->
    <div class="flex items-center space-x-3">
      <div class="relative flex-1">
        <Search class="w-5 h-5 absolute left-3 top-3 text-slate-400" />
        <input
          type="text"
          bind:value={searchQuery}
          placeholder="Cari nama produk / ketik barcode..."
          class="w-full bg-slate-900 border border-slate-700 text-white rounded-xl pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:border-sky-500 transition-colors"
        />
      </div>

      <!-- Barcode Scanner Input -->
      <form on:submit|preventDefault={handleBarcodeSubmit} class="flex items-center space-x-2 bg-slate-900 border border-slate-700 rounded-xl px-3 py-1.5">
        <Barcode class="w-5 h-5 text-sky-400" />
        <input
          type="text"
          bind:value={barcodeInput}
          placeholder="Scan Barcode (Enter)"
          class="bg-transparent text-white text-sm focus:outline-none w-44"
        />
      </form>
    </div>

    <!-- Category Filter Tabs -->
    <div class="flex space-x-2 overflow-x-auto pb-1 scrollbar-none">
      {#each categories as cat}
        <button
          on:click={() => (selectedCategory = cat)}
          class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all {selectedCategory === cat ? 'bg-sky-600 text-white shadow-md' : 'bg-slate-900 text-slate-400 hover:bg-slate-800'}"
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
          class="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-sky-500/50 p-3 rounded-2xl flex flex-col justify-between text-left transition-all group relative overflow-hidden active:scale-95"
        >
          <div class="flex items-center justify-between mb-2">
            <span class="text-3xl">{p.image}</span>
            <span class="text-[10px] bg-slate-800 text-slate-400 font-mono px-2 py-0.5 rounded-full">{p.category}</span>
          </div>

          <div>
            <h3 class="text-sm font-semibold text-slate-100 line-clamp-2 mb-1 group-hover:text-sky-400 transition-colors">{p.name}</h3>
            <p class="text-xs text-slate-400 font-mono mb-2">Stok: {p.stock}</p>
          </div>

          <div class="flex items-center justify-between border-t border-slate-800/80 pt-2 mt-1">
            <span class="text-sm font-bold text-sky-400">{formatRp(p.sellPrice)}</span>
            <div class="bg-sky-500/10 text-sky-400 p-1.5 rounded-lg group-hover:bg-sky-500 group-hover:text-white transition-colors">
              <Plus class="w-4 h-4" />
            </div>
          </div>
        </button>
      {/each}
    </div>
  </div>

  <!-- RIGHT: Cart, Actions & Checkout Panel -->
  <div class="w-[420px] bg-slate-950 flex flex-col justify-between p-4 space-y-4 border-l border-slate-800">
    <!-- Header Actions (Hold & Shift) -->
    <div class="flex items-center justify-between border-b border-slate-800 pb-3">
      <div class="flex items-center space-x-2">
        <span class="text-base font-bold text-white">Keranjang Belanja</span>
        <span class="bg-sky-500/20 text-sky-400 text-xs px-2 py-0.5 rounded-full font-bold">{$cartItems.length} Item</span>
      </div>

      <div class="flex items-center space-x-2">
        <!-- Shift Modal Button -->
        <button on:click={() => (showShiftModal = true)} class="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs font-semibold flex items-center space-x-1">
          <Clock class="w-4 h-4 text-amber-400" />
          <span>Shift</span>
        </button>

        <!-- Hold Carts List Modal -->
        <button on:click={() => (showHoldModal = true)} class="p-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded-xl border border-slate-800 text-xs font-semibold flex items-center space-x-1 relative">
          <PauseCircle class="w-4 h-4 text-sky-400" />
          <span>Hold</span>
          {#if $heldCartsStore.length > 0}
            <span class="absolute -top-1 -right-1 bg-amber-500 text-black text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">{$heldCartsStore.length}</span>
          {/if}
        </button>
      </div>
    </div>

    <!-- Cart Item List -->
    <div class="flex-1 overflow-y-auto space-y-2 pr-1">
      {#if $cartItems.length === 0}
        <div class="h-full flex flex-col items-center justify-center text-center text-slate-500 p-6 space-y-2">
          <Barcode class="w-12 h-12 stroke-[1.5] text-slate-600 animate-pulse" />
          <p class="text-sm font-medium">Keranjang masih kosong</p>
          <p class="text-xs text-slate-600">Klik produk di katalog atau scan barcode untuk menambah belanjaan</p>
        </div>
      {:else}
        {#each $cartItems as item}
          <div class="bg-slate-900 border border-slate-800 rounded-xl p-3 flex items-center justify-between">
            <div class="flex-1 pr-2">
              <h4 class="text-xs font-semibold text-slate-200 line-clamp-1">{item.name}</h4>
              <p class="text-xs text-sky-400 font-bold mt-0.5">{formatRp(item.sellPrice)}</p>
            </div>

            <!-- Qty Stepper -->
            <div class="flex items-center space-x-2">
              <button on:click={() => updateQuantity(item.id, item.quantity - 1)} class="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">
                <Minus class="w-3.5 h-3.5" />
              </button>
              <span class="text-xs font-bold text-white min-w-[20px] text-center">{item.quantity}</span>
              <button on:click={() => updateQuantity(item.id, item.quantity + 1)} class="p-1 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg">
                <Plus class="w-3.5 h-3.5" />
              </button>
              <button on:click={() => updateQuantity(item.id, 0)} class="p-1 text-red-400 hover:text-red-300 ml-1">
                <Trash2 class="w-4 h-4" />
              </button>
            </div>
          </div>
        {/each}
      {/if}
    </div>

    <!-- Summary & Checkout Footer -->
    <div class="bg-slate-900 border border-slate-800 rounded-2xl p-4 space-y-3">
      <div class="space-y-1.5 text-xs text-slate-400">
        <div class="flex justify-between">
          <span>Subtotal</span>
          <span class="text-slate-200 font-semibold">{formatRp($subtotal)}</span>
        </div>
        {#if $discountTotal > 0}
          <div class="flex justify-between text-amber-400">
            <span>Diskon Promo</span>
            <span>-{formatRp($discountTotal)}</span>
          </div>
        {/if}
        <div class="flex justify-between text-base font-bold text-white pt-2 border-t border-slate-800">
          <span>TOTAL BAYAR</span>
          <span class="text-sky-400">{formatRp($grandTotal)}</span>
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
          class="py-2.5 bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-300 text-xs font-bold rounded-xl flex items-center justify-center space-x-1"
        >
          <PauseCircle class="w-4 h-4 text-sky-400" />
          <span>HOLD CART</span>
        </button>

        <button
          disabled={$cartItems.length === 0}
          on:click={() => {
            paidAmount = $grandTotal;
            showPaymentModal = true;
          }}
          class="py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-xl flex items-center justify-center space-x-1 shadow-lg shadow-emerald-900/30"
        >
          <CreditCard class="w-4 h-4" />
          <span>BAYAR (F8)</span>
        </button>
      </div>
    </div>
  </div>
</div>

<!-- MODAL 1: PAYMENT MODAL -->
{#if showPaymentModal}
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl">
      <div class="flex items-center justify-between border-b border-slate-800 pb-3">
        <h3 class="text-lg font-bold text-white flex items-center space-x-2">
          <DollarSign class="w-5 h-5 text-emerald-400" />
          <span>Pembayaran Kasir</span>
        </h3>
        <button on:click={() => (showPaymentModal = false)} class="text-slate-400 hover:text-white">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 text-center space-y-1">
        <span class="text-xs text-slate-400 font-semibold uppercase tracking-wider">Total Tagihan</span>
        <div class="text-3xl font-black text-sky-400">{formatRp($grandTotal)}</div>
      </div>

      <!-- Payment Method Selection -->
      <div class="space-y-2">
        <label class="text-xs font-semibold text-slate-400">Metode Pembayaran</label>
        <div class="grid grid-cols-3 gap-2">
          <button
            on:click={() => (paymentMethod = 'CASH')}
            class="py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all {paymentMethod === 'CASH' ? 'bg-sky-600 border-sky-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}"
          >
            <DollarSign class="w-4 h-4" />
            <span>TUNAI</span>
          </button>
          <button
            on:click={() => (paymentMethod = 'QRIS')}
            class="py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all {paymentMethod === 'QRIS' ? 'bg-sky-600 border-sky-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}"
          >
            <QrCode class="w-4 h-4" />
            <span>QRIS</span>
          </button>
          <button
            on:click={() => (paymentMethod = 'DEBIT')}
            class="py-2.5 rounded-xl border text-xs font-bold flex items-center justify-center space-x-2 transition-all {paymentMethod === 'DEBIT' ? 'bg-sky-600 border-sky-500 text-white' : 'bg-slate-950 border-slate-800 text-slate-400'}"
          >
            <CreditCard class="w-4 h-4" />
            <span>DEBIT</span>
          </button>
        </div>
      </div>

      <!-- Quick Cash Buttons -->
      {#if paymentMethod === 'CASH'}
        <div class="space-y-2">
          <label class="text-xs font-semibold text-slate-400">Uang Pas & Quick Cash</label>
          <div class="grid grid-cols-4 gap-2">
            <button on:click={() => handleQuickPay($grandTotal)} class="py-2 bg-slate-800 hover:bg-slate-700 text-emerald-400 text-xs font-bold rounded-xl border border-slate-700">Uang Pas</button>
            <button on:click={() => handleQuickPay(20000)} class="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700">Rp 20.000</button>
            <button on:click={() => handleQuickPay(50000)} class="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700">Rp 50.000</button>
            <button on:click={() => handleQuickPay(100000)} class="py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold rounded-xl border border-slate-700">Rp 100.000</button>
          </div>

          <div class="pt-2">
            <label class="text-xs font-semibold text-slate-400">Nominal Diterima (Rp)</label>
            <input
              type="number"
              bind:value={paidAmount}
              class="w-full bg-slate-950 border border-slate-800 text-white text-lg font-mono font-bold rounded-xl px-4 py-2.5 mt-1 focus:outline-none focus:border-sky-500"
            />
          </div>

          <div class="flex justify-between items-center bg-slate-950 p-3 rounded-xl border border-slate-800 text-sm">
            <span class="text-slate-400 font-semibold">Kembalian</span>
            <span class="text-emerald-400 font-bold text-lg">{formatRp(changeAmount)}</span>
          </div>
        </div>
      {/if}

      <button
        on:click={processPayment}
        class="w-full py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-2xl shadow-lg shadow-emerald-900/40 transition-all flex items-center justify-center space-x-2"
      >
        <CheckCircle2 class="w-5 h-5" />
        <span>KONFIRMASI TRANSAKSI</span>
      </button>
    </div>
  </div>
{/if}

<!-- MODAL 2: RECEIPT MODAL -->
{#if showReceiptModal && lastCompletedTransaction}
  <div class="fixed inset-0 bg-black/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl p-6 max-w-md w-full space-y-4 text-center">
      <div class="text-emerald-400 flex flex-col items-center space-y-1">
        <CheckCircle2 class="w-12 h-12" />
        <h3 class="text-lg font-bold text-white">Transaksi Berhasil!</h3>
      </div>

      <!-- Thermal Printable Receipt Preview -->
      <div class="flex justify-center my-4 overflow-hidden rounded-xl">
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
        <button on:click={printReceipt} class="py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold rounded-xl flex items-center justify-center space-x-2">
          <Printer class="w-4 h-4" />
          <span>CETAK STRUK</span>
        </button>
        <button on:click={() => (showReceiptModal = false)} class="py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold rounded-xl">
          <span>TUTUP</span>
        </button>
      </div>
    </div>
  </div>
{/if}

<!-- MODAL 3: HOLD CARTS DRAWER -->
{#if showHoldModal}
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg p-6 space-y-4">
      <div class="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 class="text-lg font-bold text-white flex items-center space-x-2">
          <PauseCircle class="w-5 h-5 text-amber-400" />
          <span>Daftar Transaksi Ditunda (Hold)</span>
        </h3>
        <button on:click={() => (showHoldModal = false)} class="text-slate-400 hover:text-white">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="space-y-2 max-h-96 overflow-y-auto">
        {#if $heldCartsStore.length === 0}
          <p class="text-sm text-slate-500 text-center py-6">Tidak ada keranjang yang ditunda.</p>
        {:else}
          {#each $heldCartsStore as hold}
            <div class="bg-slate-950 border border-slate-800 p-3 rounded-xl flex items-center justify-between">
              <div>
                <h4 class="text-sm font-bold text-white">{hold.label}</h4>
                <p class="text-xs text-slate-400">{hold.timestamp} • {hold.items.length} item</p>
              </div>
              <button
                on:click={() => {
                  resumeCart(hold.id);
                  showHoldModal = false;
                }}
                class="px-3 py-1.5 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg flex items-center space-x-1"
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
  <div class="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
    <div class="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 space-y-5">
      <div class="flex justify-between items-center border-b border-slate-800 pb-3">
        <h3 class="text-lg font-bold text-white flex items-center space-x-2">
          <Clock class="w-5 h-5 text-sky-400" />
          <span>Manajemen Shift Kasir</span>
        </h3>
        <button on:click={() => (showShiftModal = false)} class="text-slate-400 hover:text-white">
          <X class="w-5 h-5" />
        </button>
      </div>

      <div class="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2 text-xs text-slate-300">
        <div class="flex justify-between">
          <span>Kasir Aktif:</span>
          <span class="font-bold text-white">{$shiftStore.cashierName}</span>
        </div>
        <div class="flex justify-between">
          <span>Kas Awal Laci:</span>
          <span class="font-bold text-emerald-400">{formatRp($shiftStore.startingCash)}</span>
        </div>
        <div class="flex justify-between">
          <span>Waktu Clock-In:</span>
          <span class="font-mono text-slate-400">{new Date($shiftStore.clockInTime || '').toLocaleTimeString('id-ID')}</span>
        </div>
      </div>

      <div class="space-y-3 pt-2">
        <h4 class="text-xs font-bold text-slate-400 uppercase tracking-wider">Rekap & Clock-Out Laci</h4>
        <input type="number" placeholder="Masukkan total uang fisik di laci (Rp)" class="w-full bg-slate-950 border border-slate-800 text-white rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-sky-500" />
        <button
          on:click={() => {
            alert('Shift berhasil ditutup dan rekap kasir telah dicetak!');
            showShiftModal = false;
          }}
          class="w-full py-3 bg-red-600 hover:bg-red-500 text-white font-bold rounded-xl text-xs uppercase tracking-wider"
        >
          CLOCK-OUT & CETAK REKAP LACI
        </button>
      </div>
    </div>
  </div>
{/if}
