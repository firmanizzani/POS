<script lang="ts">
  export let storeName = "PopMart";
  export let address = "Jl. Raya Utama No. 88, Jakarta";
  export let phone = "0812-3456-7890";
  export let invoiceNumber = "INV-20260910-001";
  export let cashierName = "Ahmad Kasir";
  export let items: any[] = [];
  export let subtotal = 0;
  export let discount = 0;
  export let grandTotal = 0;
  export let paidAmount = 0;
  export let changeAmount = 0;
  export let paymentMethod = "CASH";
  export let timestamp = new Date().toLocaleString("id-ID");

  function formatRp(val: number) {
    return new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(val);
  }
</script>

<div id="thermal-receipt" class="p-3 bg-white text-black font-mono text-xs w-[80mm] border border-dashed border-gray-300">
  <div class="text-center font-bold text-sm uppercase mb-1">{storeName}</div>
  <div class="text-center text-[10px] text-gray-700">{address}</div>
  <div class="text-center text-[10px] text-gray-700 mb-2">Telp: {phone}</div>
  
  <div class="border-b border-black border-dashed my-1"></div>
  
  <div class="flex justify-between text-[11px]">
    <span>No: {invoiceNumber}</span>
    <span>{timestamp}</span>
  </div>
  <div class="text-[11px] mb-1">Kasir: {cashierName}</div>
  
  <div class="border-b border-black border-dashed my-1"></div>
  
  <table class="w-full text-left my-2 text-[11px]">
    <thead>
      <tr class="border-b border-gray-400">
        <th class="py-1">Item</th>
        <th class="text-center">Qty</th>
        <th class="text-right">Total</th>
      </tr>
    </thead>
    <tbody>
      {#each items as item}
        <tr>
          <td colspan="3" class="pt-1 font-semibold">{item.name}</td>
        </tr>
        <tr class="text-[10px] text-gray-700">
          <td class="pb-1 pl-2">{formatRp(item.sellPrice)}</td>
          <td class="text-center pb-1">x{item.quantity}</td>
          <td class="text-right pb-1 font-mono">{formatRp(item.sellPrice * item.quantity)}</td>
        </tr>
      {/each}
    </tbody>
  </table>

  <div class="border-b border-black border-dashed my-1"></div>
  
  <div class="space-y-1 text-[11px]">
    <div class="flex justify-between">
      <span>Subtotal</span>
      <span>{formatRp(subtotal)}</span>
    </div>
    {#if discount > 0}
      <div class="flex justify-between text-red-600">
        <span>Diskon</span>
        <span>-{formatRp(discount)}</span>
      </div>
    {/if}
    <div class="flex justify-between font-bold text-sm pt-1 border-t border-gray-300">
      <span>TOTAL</span>
      <span>{formatRp(grandTotal)}</span>
    </div>
    <div class="flex justify-between">
      <span>Metode: {paymentMethod}</span>
      <span>Bayar: {formatRp(paidAmount)}</span>
    </div>
    <div class="flex justify-between font-bold">
      <span>Kembali</span>
      <span>{formatRp(changeAmount)}</span>
    </div>
  </div>

  <div class="border-b border-black border-dashed my-2"></div>
  <div class="text-center text-[10px] font-semibold uppercase">*** TERIMA KASIH ***</div>
  <div class="text-center text-[9px] text-gray-500">Barang yang sudah dibeli tidak dapat ditukar</div>
</div>
