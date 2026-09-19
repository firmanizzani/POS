import { db } from './index.js';
import { transactions, transactionItems, products, members, cashierShifts, users } from './schema.js';
import { eq } from 'drizzle-orm';

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

// Automatic Sync Engine: Auto-pushes offline memoryStore transactions to DB when DB is connected
export async function syncMemoryStoreToDb() {
  try {
    const dbTrxList = await db.select({ id: transactions.id, invoiceNumber: transactions.invoiceNumber }).from(transactions);
    const dbInvoiceSet = new Set(dbTrxList.map(t => t.invoiceNumber));

    for (const memTrx of memoryStore.transactions) {
      if (!dbInvoiceSet.has(memTrx.invoiceNumber)) {
        let dbShiftId = null;
        if (memTrx.shiftId) {
          const checkShift = await db.select({ id: cashierShifts.id }).from(cashierShifts).where(eq(cashierShifts.id, memTrx.shiftId));
          if (checkShift.length > 0) dbShiftId = memTrx.shiftId;
        }

        let dbMemberId = null;
        if (memTrx.memberId) {
          const checkMember = await db.select({ id: members.id }).from(members).where(eq(members.id, memTrx.memberId));
          if (checkMember.length > 0) dbMemberId = memTrx.memberId;
        }

        let dbCashierId = 'user-kasir-1';
        if (memTrx.cashierId) {
          const checkUser = await db.select({ id: users.id }).from(users).where(eq(users.id, memTrx.cashierId));
          if (checkUser.length > 0) dbCashierId = memTrx.cashierId;
        }

        await db.insert(transactions).values({
          id: memTrx.id,
          invoiceNumber: memTrx.invoiceNumber,
          cashierId: dbCashierId,
          shiftId: dbShiftId,
          memberId: dbMemberId,
          promoId: memTrx.promoId || null,
          subtotal: memTrx.subtotal.toString(),
          discountTotal: (memTrx.discountTotal || 0).toString(),
          grandTotal: memTrx.grandTotal.toString(),
          paidAmount: memTrx.paidAmount.toString(),
          changeAmount: (memTrx.changeAmount || 0).toString(),
          paymentMethod: (memTrx.paymentMethod || 'cash').toLowerCase(),
          earnedPoints: memTrx.earnedPoints || 0,
          createdAt: new Date(memTrx.createdAt)
        }).onConflictDoNothing();

        for (const itemAny of (memTrx.items || [])) {
          const item = itemAny as any;
          let dbProdId = item.productId;
          if (dbProdId) {
            const checkProd = await db.select({ id: products.id }).from(products).where(eq(products.id, item.productId));
            if (checkProd.length === 0) {
              const firstProd = await db.select({ id: products.id }).from(products).limit(1);
              if (firstProd.length > 0) dbProdId = firstProd[0].id;
            }
          } else {
            const firstProd = await db.select({ id: products.id }).from(products).limit(1);
            if (firstProd.length > 0) dbProdId = firstProd[0].id;
          }

          const itemSellPrice = Number(item.sellPrice || item.price || 0);
          const itemQty = Number(item.quantity || item.qty || 1);
          const itemSubtotal = Number(item.subtotal || (itemSellPrice * itemQty));

          await db.insert(transactionItems).values({
            id: item.id || `ti-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
            transactionId: memTrx.id,
            productId: dbProdId,
            productName: item.productName || item.name || 'Produk',
            costPrice: (item.costPrice || 0).toString(),
            sellPrice: itemSellPrice.toString(),
            quantity: itemQty,
            subtotal: itemSubtotal.toString()
          }).onConflictDoNothing();
        }

        dbInvoiceSet.add(memTrx.invoiceNumber);
        console.log(`✅ Auto-synced offline transaction ${memTrx.invoiceNumber} to PostgreSQL DB`);
      }
    }
  } catch (e: any) {
    // Silently handle if DB is temporarily offline
  }
}
