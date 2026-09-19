import { Elysia } from 'elysia';
import { db } from '../db/index.js';
import { transactions, transactionItems, users } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { memoryStore } from '../db/store.js';

export const transactionRoutes = new Elysia({ prefix: '/transactions' })
  .get('/', async () => {
    let dbTrxList: any[] = [];
    try {
      const trxs = await db.select({
        id: transactions.id,
        invoiceNumber: transactions.invoiceNumber,
        cashierId: transactions.cashierId,
        cashierName: users.name,
        subtotal: transactions.subtotal,
        discountTotal: transactions.discountTotal,
        grandTotal: transactions.grandTotal,
        paidAmount: transactions.paidAmount,
        changeAmount: transactions.changeAmount,
        paymentMethod: transactions.paymentMethod,
        createdAt: transactions.createdAt
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.cashierId, users.id))
      .orderBy(desc(transactions.createdAt));

      if (trxs.length > 0) {
        const items = await db.select().from(transactionItems);
        const itemMap = new Map<string, any[]>();
        for (const item of items) {
          if (!itemMap.has(item.transactionId)) itemMap.set(item.transactionId, []);
          itemMap.get(item.transactionId)!.push({
            name: item.productName,
            qty: item.quantity,
            price: Number(item.sellPrice)
          });
        }

        const userMap = new Map(memoryStore.users.map(u => [u.id, u.name]));
        const memberMap = new Map(memoryStore.members.map((m: any) => [m.id, `${m.name} (${m.memberCode || m.code || ''})`]));
        const promoMap = new Map(memoryStore.promos.map(p => [p.id, p.code]));

        dbTrxList = trxs.map(t => {
          const trxItems = itemMap.get(t.id) || [];
          const memTrx: any = memoryStore.transactions.find((m: any) => m.id === t.id || m.invoiceNumber === t.invoiceNumber);
          return {
            invoiceNumber: t.invoiceNumber,
            date: formatDateTime(t.createdAt),
            cashierName: t.cashierName || userMap.get(t.cashierId) || 'Kasir',
            memberName: memTrx?.memberId ? memberMap.get(memTrx.memberId) || 'Member' : null,
            promoCode: memTrx?.promoCode || (memTrx?.promoId ? promoMap.get(memTrx.promoId) : null) || null,
            earnedPoints: memTrx?.earnedPoints || 0,
            itemsCount: trxItems.reduce((acc, i) => acc + i.qty, 0),
            subtotal: Number(t.subtotal),
            discount: Number(t.discountTotal),
            grandTotal: Number(t.grandTotal),
            paidAmount: Number(t.paidAmount),
            changeAmount: Number(t.changeAmount),
            paymentMethod: t.paymentMethod.toUpperCase(),
            items: trxItems
          };
        });
      }
    } catch (e: any) {
      console.warn('DB transactions error, fallback to memoryStore:', e.message);
    }

    const userMap = new Map(memoryStore.users.map(u => [u.id, u.name]));
    const memberMap = new Map(memoryStore.members.map((m: any) => [m.id, `${m.name} (${m.memberCode || m.code || ''})`]));
    const promoMap = new Map(memoryStore.promos.map(p => [p.id, p.code]));

    const memTrxList = memoryStore.transactions.map((t: any) => ({
      invoiceNumber: t.invoiceNumber,
      date: formatDateTime(t.createdAt),
      cashierName: userMap.get(t.cashierId) || 'Ahmad Kasir',
      memberName: t.memberId ? memberMap.get(t.memberId) || 'Member' : null,
      promoCode: t.promoCode || (t.promoId ? promoMap.get(t.promoId) : null) || null,
      earnedPoints: t.earnedPoints || 0,
      itemsCount: (t.items || []).reduce((acc: number, i: any) => acc + i.quantity, 0),
      subtotal: Number(t.subtotal),
      discount: Number(t.discountTotal),
      grandTotal: Number(t.grandTotal),
      paidAmount: Number(t.paidAmount),
      changeAmount: Number(t.changeAmount),
      paymentMethod: t.paymentMethod.toUpperCase(),
      items: (t.items || []).map((i: any) => ({
        name: i.productName,
        qty: i.quantity,
        price: Number(i.sellPrice)
      }))
    }));

    // Merge transactions by invoiceNumber to guarantee nothing is missed
    const existingInvoices = new Set(dbTrxList.map(t => t.invoiceNumber));
    const mergedList = [...dbTrxList];
    for (const memTrx of memTrxList) {
      if (!existingInvoices.has(memTrx.invoiceNumber)) {
        mergedList.push(memTrx);
      }
    }

    return { success: true, data: mergedList.length > 0 ? mergedList : memTrxList };
  });

function formatDateTime(date: Date) {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
