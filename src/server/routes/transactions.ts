import { Elysia } from 'elysia';
import { db } from '../db/index.js';
import { transactions, transactionItems, users } from '../db/schema.js';
import { eq } from 'drizzle-orm';
import { memoryStore } from '../db/store.js';

export const transactionRoutes = new Elysia({ prefix: '/transactions' })
  .get('/', async () => {
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
      .leftJoin(users, eq(transactions.cashierId, users.id));

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

        return {
          success: true,
          data: trxs.map(t => {
            const trxItems = itemMap.get(t.id) || [];
            return {
              invoiceNumber: t.invoiceNumber,
              date: formatDateTime(t.createdAt),
              cashierName: t.cashierName || 'Kasir',
              itemsCount: trxItems.reduce((acc, i) => acc + i.qty, 0),
              subtotal: Number(t.subtotal),
              discount: Number(t.discountTotal),
              grandTotal: Number(t.grandTotal),
              paidAmount: Number(t.paidAmount),
              changeAmount: Number(t.changeAmount),
              paymentMethod: t.paymentMethod.toUpperCase(),
              items: trxItems
            };
          })
        };
      }
    } catch (e: any) {
      console.warn('DB transactions error, fallback to memoryStore:', e.message);
    }

    const userMap = new Map(memoryStore.users.map(u => [u.id, u.name]));
    const memberMap = new Map(memoryStore.members.map((m: any) => [m.id, `${m.name} (${m.memberCode || m.code || ''})`]));
    const promoMap = new Map(memoryStore.promos.map(p => [p.id, p.code]));

    const data = memoryStore.transactions.map((t: any) => ({
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

    return { success: true, data };
  });

function formatDateTime(date: Date) {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
