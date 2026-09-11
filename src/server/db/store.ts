import {
  initialCategories,
  initialProducts,
  initialSuppliers,
  initialPurchaseOrders,
  initialStockAdjustments,
  initialMembers,
  initialPromos,
  initialTransactions,
  initialUsers,
  initialShifts
} from './seed.js';

// In-Memory Data Store Fallback
export const memoryStore = {
  categories: [...initialCategories],
  products: [...initialProducts],
  suppliers: [...initialSuppliers],
  purchaseOrders: [...initialPurchaseOrders],
  stockAdjustments: [...initialStockAdjustments],
  members: [...initialMembers],
  promos: [...initialPromos],
  transactions: [...initialTransactions],
  users: [...initialUsers],
  shifts: [...initialShifts]
};
