import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { products, categories, transactions, transactionItems } from '../db/schema.js';
import { eq, lte, sql, desc, and, gte } from 'drizzle-orm';

export const analyticsRoutes = new Elysia({ prefix: '/analytics' })
  .get('/summary', async () => {
    return await getDashboardData(null, null);
  })
  .get('/dashboard', async ({ query }: { query: any }) => {
    const dateFrom = query?.dateFrom ? new Date(query.dateFrom) : null;
    const dateTo = query?.dateTo ? new Date(query.dateTo) : null;
    return await getDashboardData(dateFrom, dateTo);
  })
  .get('/revenue', async ({ query }: { query: any }) => {
    const period = query?.period || 'daily';

    // Semua kalkulasi waktu menggunakan WIB (UTC+7)
    const WIB_OFFSET_MS = 7 * 60 * 60 * 1000;
    const nowUTC = new Date();
    // "Sekarang" dalam perspektif WIB
    const nowWIB = new Date(nowUTC.getTime() + WIB_OFFSET_MS);

    let dateFrom: Date;
    let dateTo: Date;

    if (period === 'daily') {
      // Tengah malam WIB hari ini = midnight WIB → konversi ke UTC
      const midnightWIB = new Date(Date.UTC(
        nowWIB.getUTCFullYear(),
        nowWIB.getUTCMonth(),
        nowWIB.getUTCDate(),
        0, 0, 0, 0
      ) - WIB_OFFSET_MS);
      const endOfDayWIB = new Date(midnightWIB.getTime() + 24 * 60 * 60 * 1000 - 1);
      dateFrom = midnightWIB;
      dateTo = endOfDayWIB;
    } else if (period === 'weekly') {
      const now = new Date(nowUTC);
      dateFrom = new Date(now);
      dateFrom.setDate(now.getDate() - 6);
      dateFrom.setHours(0, 0, 0, 0);
      dateTo = new Date(now);
      dateTo.setHours(23, 59, 59, 999);
    } else if (period === 'monthly') {
      const now = new Date(nowUTC);
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      dateTo = new Date(now);
      dateTo.setHours(23, 59, 59, 999);
    } else if (period === 'yearly') {
      const now = new Date(nowUTC);
      dateFrom = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
      dateTo = new Date(now);
      dateTo.setHours(23, 59, 59, 999);
    } else {
      dateFrom = query?.dateFrom ? new Date(query.dateFrom + 'T00:00:00') : new Date(nowUTC.getFullYear(), nowUTC.getMonth(), 1);
      dateTo = query?.dateTo ? new Date(query.dateTo + 'T23:59:59') : new Date(nowUTC);
      dateTo.setHours(23, 59, 59, 999);
    }

    return await getRevenueData(dateFrom, dateTo, period);
  });


async function getDashboardData(dateFrom: Date | null, dateTo: Date | null) {
  try {
    const dbLowStock = await db
      .select({
        name: products.name,
        stock: products.stock,
        minAlert: products.minStockAlert,
        category: categories.name
      })
      .from(products)
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .where(lte(products.stock, products.minStockAlert))
      .limit(10);

    const dbTopSelling = await db
      .select({
        name: transactionItems.productName,
        soldQty: sql<number>`SUM(${transactionItems.quantity})::int`,
        revenue: sql<number>`SUM(${transactionItems.subtotal})::numeric`,
        categoryId: products.categoryId,
        categoryName: categories.name
      })
      .from(transactionItems)
      .leftJoin(products, eq(transactionItems.productId, products.id))
      .leftJoin(categories, eq(products.categoryId, categories.id))
      .leftJoin(transactions, eq(transactionItems.transactionId, transactions.id))
      .where(
        dateFrom && dateTo
          ? and(gte(transactions.createdAt, dateFrom), lte(transactions.createdAt, dateTo))
          : undefined
      )
      .groupBy(transactionItems.productName, products.categoryId, categories.name)
      .orderBy(desc(sql`SUM(${transactionItems.quantity})`))
      .limit(5);

    const allTransactions = dateFrom && dateTo
      ? (await db.select().from(transactions).where(and(gte(transactions.createdAt, dateFrom), lte(transactions.createdAt, dateTo))))
      : await db.select().from(transactions);

    const totalTransactions = allTransactions.length;
    const totalOmset = allTransactions.reduce((acc, t) => acc + Number(t.grandTotal || 0), 0);

    const trxIds = allTransactions.map(t => t.id);
    const allItems = trxIds.length > 0
      ? await db.select().from(transactionItems)
      : [];
    const filteredItems = dateFrom && dateTo
      ? allItems.filter(i => trxIds.includes(i.transactionId))
      : allItems;

    const dbProds = await db.select({ id: products.id, name: products.name, costPrice: products.costPrice }).from(products);
    const prodCostMap = new Map(dbProds.map(p => [p.id, Number(p.costPrice || 0)]));
    const prodNameCostMap = new Map(dbProds.map(p => [p.name, Number(p.costPrice || 0)]));

    const totalCost = filteredItems.reduce((acc, i) => {
      let cost = Number(i.costPrice || 0);
      if (cost === 0) {
        cost = prodCostMap.get(i.productId || '') || prodNameCostMap.get(i.productName || '') || (Number(i.sellPrice || 0) * 0.8);
      }
      return acc + (cost * i.quantity);
    }, 0);
    const netProfit = totalOmset - totalCost;
    const averageOrderValue = totalTransactions > 0 ? Math.round(totalOmset / totalTransactions) : 0;

    const topProducts = dbTopSelling.map(tp => ({
      name: tp.name,
      category: tp.categoryName || 'Lainnya',
      soldQty: Number(tp.soldQty || 0),
      revenue: Number(tp.revenue || 0)
    }));

    const lowStockAlerts = dbLowStock.map(ls => ({
      name: ls.name,
      stock: ls.stock,
      minAlert: ls.minAlert,
      category: ls.category || 'Umum'
    }));

    return {
      success: true,
      data: {
        totalOmset,
        netProfit,
        totalTransactions,
        averageOrderValue,
        topProducts,
        lowStockAlerts
      }
    };
  } catch (e: any) {
    console.error('DB analytics error:', e.message);
    return {
      success: false,
      message: 'Gagal memuat analitik: ' + e.message,
      data: { totalOmset: 0, netProfit: 0, totalTransactions: 0, averageOrderValue: 0, topProducts: [], lowStockAlerts: [] }
    };
  }
}

async function getRevenueData(dateFrom: Date, dateTo: Date, period: string) {
  const isDaily = period === 'daily';
  const timeSlots = ['08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00', '22:00'];
  
  const dayLabels: string[] = [];
  if (isDaily) {
    dayLabels.push(...timeSlots);
  } else {
    const current = new Date(dateFrom);
    while (current <= dateTo) {
      dayLabels.push(current.toISOString().slice(0, 10));
      current.setDate(current.getDate() + 1);
    }
  }

  try {
    const allTrx = await db.select().from(transactions)
      .where(and(gte(transactions.createdAt, dateFrom), lte(transactions.createdAt, dateTo)));
    const allItems = await db.select().from(transactionItems);
    const itemMap = new Map<string, any[]>();
    for (const item of allItems) {
      if (!itemMap.has(item.transactionId)) itemMap.set(item.transactionId, []);
      itemMap.get(item.transactionId)!.push(item);
    }

    const dbProds = await db.select({ id: products.id, name: products.name, costPrice: products.costPrice }).from(products);
    const prodCostMap = new Map(dbProds.map(p => [p.id, Number(p.costPrice || 0)]));
    const prodNameCostMap = new Map(dbProds.map(p => [p.name, Number(p.costPrice || 0)]));

    const byLabel = new Map<string, { omset: number; profit: number; count: number }>();
    for (const label of dayLabels) {
      byLabel.set(label, { omset: 0, profit: 0, count: 0 });
    }

    let totalOmset = 0;
    let totalCost = 0;
    let totalTransactions = 0;

    for (const t of allTrx) {
      let key = '';
      if (isDaily) {
        // Gunakan jam WIB (UTC+7) bukan jam UTC server
        const hourWIB = (new Date(t.createdAt).getUTCHours() + 7) % 24;
        if (hourWIB <= 8) key = '08:00';
        else if (hourWIB <= 10) key = '10:00';
        else if (hourWIB <= 12) key = '12:00';
        else if (hourWIB <= 14) key = '14:00';
        else if (hourWIB <= 16) key = '16:00';
        else if (hourWIB <= 18) key = '18:00';
        else if (hourWIB <= 20) key = '20:00';
        else key = '22:00';
      } else {
        key = new Date(t.createdAt).toISOString().slice(0, 10);
      }

      const omset = Number(t.grandTotal || 0);
      const items = itemMap.get(t.id) || [];
      const cost = items.reduce((acc: number, i: any) => {
        let c = Number(i.costPrice || 0);
        if (c === 0) {
          c = prodCostMap.get(i.productId || '') || prodNameCostMap.get(i.productName || '') || (Number(i.sellPrice || 0) * 0.8);
        }
        return acc + (c * Number(i.quantity || 1));
      }, 0);
      const profit = omset - cost;

      const slot = byLabel.get(key) || { omset: 0, profit: 0, count: 0 };
      slot.omset += omset;
      slot.profit += profit;
      slot.count += 1;
      byLabel.set(key, slot);

      totalOmset += omset;
      totalCost += cost;
      totalTransactions += 1;
    }

    const netProfit = totalOmset - totalCost;
    const averageOrderValue = totalTransactions > 0 ? Math.round(totalOmset / totalTransactions) : 0;

    const chartData = Array.from(byLabel.entries()).map(([date, v]) => ({
      date,
      omset: v.omset,
      profit: v.profit,
      transactions: v.count
    }));

    return {
      success: true,
      data: {
        period,
        dateFrom: dateFrom.toISOString().slice(0, 10),
        dateTo: dateTo.toISOString().slice(0, 10),
        totalOmset,
        netProfit,
        totalTransactions,
        averageOrderValue,
        chartData
      }
    };
  } catch (e: any) {
    console.error('DB revenue error:', e.message);
    return {
      success: false,
      message: 'Gagal memuat pendapatan: ' + e.message,
      data: { period, dateFrom: dateFrom.toISOString().slice(0, 10), dateTo: dateTo.toISOString().slice(0, 10), totalOmset: 0, netProfit: 0, totalTransactions: 0, averageOrderValue: 0, chartData: [] }
    };
  }
}
