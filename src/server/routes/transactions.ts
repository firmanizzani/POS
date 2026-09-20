import { Elysia } from 'elysia';
import { db } from '../db/index.js';
import { transactions, transactionItems, users, members, promos } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';

export const transactionRoutes = new Elysia({ prefix: '/transactions' })
  .get('/', async () => {
    try {
      const trxs = await db.select({
        id: transactions.id,
        invoiceNumber: transactions.invoiceNumber,
        cashierId: transactions.cashierId,
        cashierName: users.name,
        memberId: transactions.memberId,
        promoId: transactions.promoId,
        subtotal: transactions.subtotal,
        discountTotal: transactions.discountTotal,
        grandTotal: transactions.grandTotal,
        paidAmount: transactions.paidAmount,
        changeAmount: transactions.changeAmount,
        paymentMethod: transactions.paymentMethod,
        earnedPoints: transactions.earnedPoints,
        createdAt: transactions.createdAt
      })
      .from(transactions)
      .leftJoin(users, eq(transactions.cashierId, users.id))
      .orderBy(desc(transactions.createdAt));

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

      const dbMembers = await db.select({ id: members.id, name: members.name, code: members.memberCode }).from(members).catch(() => []);
      const memberMap = new Map(dbMembers.map(m => [m.id, `${m.name} (${m.code})`]));

      const dbPromos = await db.select({ id: promos.id, code: promos.code }).from(promos).catch(() => []);
      const promoMap = new Map(dbPromos.map(p => [p.id, p.code]));

      const dbTrxList = trxs.map(t => {
        const trxItems = itemMap.get(t.id) || [];
        return {
          invoiceNumber: t.invoiceNumber,
          date: formatDateTime(t.createdAt),
          cashierName: t.cashierName || 'Kasir',
          memberName: t.memberId ? memberMap.get(t.memberId) || 'Member' : null,
          promoCode: t.promoId ? promoMap.get(t.promoId) || null : null,
          earnedPoints: t.earnedPoints || 0,
          itemsCount: trxItems.reduce((acc, i) => acc + i.qty, 0),
          subtotal: Number(t.subtotal),
          discount: Number(t.discountTotal),
          grandTotal: Number(t.grandTotal),
          paidAmount: Number(t.paidAmount),
          changeAmount: Number(t.changeAmount),
          paymentMethod: (t.paymentMethod || 'cash').toUpperCase(),
          items: trxItems
        };
      });

      return { success: true, data: dbTrxList };
    } catch (e: any) {
      console.error('DB transactions error:', e.message);
      return { success: false, message: 'Gagal mengambil riwayat transaksi: ' + e.message, data: [] };
    }
  });

function formatDateTime(date: Date) {
  const d = new Date(date);
  const pad = (n: number) => n.toString().padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}
