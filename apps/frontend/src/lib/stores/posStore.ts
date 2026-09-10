import { writable, derived } from 'svelte/store';

export interface CartItem {
  id: string;
  barcode: string;
  name: string;
  sellPrice: number;
  costPrice: number;
  quantity: number;
  unit: string;
}

export interface ShiftState {
  isClockedIn: boolean;
  shiftId: string | null;
  cashierName: string;
  startingCash: number;
  clockInTime: string | null;
}

export interface HeldCart {
  id: string;
  label: string;
  timestamp: string;
  items: CartItem[];
  member: any;
}

// 1. Shift Store
export const shiftStore = writable<ShiftState>({
  isClockedIn: true,
  shiftId: 'shift-1001',
  cashierName: 'Ahmad Kasir',
  startingCash: 200000,
  clockInTime: new Date().toISOString()
});

// 2. Cart Store
export const cartItems = writable<CartItem[]>([
  {
    id: 'prod-1',
    barcode: '899100110011',
    name: 'Indomie Goreng Original 85g',
    sellPrice: 3200,
    costPrice: 2800,
    quantity: 2,
    unit: 'pcs'
  },
  {
    id: 'prod-2',
    barcode: '899200220022',
    name: 'Air Mineral Aqua 600ml',
    sellPrice: 3500,
    costPrice: 2500,
    quantity: 1,
    unit: 'botol'
  }
]);

export const selectedMember = writable<any>(null);
export const appliedPromo = writable<any>(null);
export const heldCartsStore = writable<HeldCart[]>([]);

// Derived Calculations
export const subtotal = derived(cartItems, ($items) =>
  $items.reduce((acc, item) => acc + item.sellPrice * item.quantity, 0)
);

export const discountTotal = derived([subtotal, appliedPromo], ([$subtotal, $promo]) => {
  if (!$promo) return 0;
  if ($promo.type === 'percentage') {
    return ($subtotal * $promo.value) / 100;
  }
  if ($promo.type === 'fixed') {
    return $promo.value;
  }
  return 0;
});

export const grandTotal = derived([subtotal, discountTotal], ([$subtotal, $discount]) =>
  Math.max(0, $subtotal - $discount)
);

// Actions
export const addToCart = (product: any) => {
  cartItems.update((items) => {
    const existingIndex = items.findIndex((i) => i.id === product.id || i.barcode === product.barcode);
    if (existingIndex > -1) {
      const updated = [...items];
      updated[existingIndex].quantity += 1;
      return updated;
    } else {
      return [
        ...items,
        {
          id: product.id,
          barcode: product.barcode,
          name: product.name,
          sellPrice: product.sellPrice,
          costPrice: product.costPrice || 0,
          quantity: 1,
          unit: product.unit || 'pcs'
        }
      ];
    }
  });
};

export const updateQuantity = (id: string, qty: number) => {
  cartItems.update((items) => {
    if (qty <= 0) {
      return items.filter((i) => i.id !== id);
    }
    return items.map((i) => (i.id === id ? { ...i, quantity: qty } : i));
  });
};

export const clearCart = () => {
  cartItems.set([]);
  selectedMember.set(null);
  appliedPromo.set(null);
};

export const holdCurrentCart = (label: string) => {
  cartItems.subscribe((items) => {
    if (items.length === 0) return;
    heldCartsStore.update((held) => [
      ...held,
      {
        id: `hold-${Date.now()}`,
        label: label || `Hold #${held.length + 1}`,
        timestamp: new Date().toLocaleTimeString('id-ID'),
        items: [...items],
        member: null
      }
    ]);
  })();
  clearCart();
};

export const resumeCart = (holdId: string) => {
  heldCartsStore.update((held) => {
    const target = held.find((h) => h.id === holdId);
    if (target) {
      cartItems.set(target.items);
    }
    return held.filter((h) => h.id !== holdId);
  });
};
