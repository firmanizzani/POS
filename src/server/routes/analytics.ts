import { Elysia, t } from 'elysia';
import { db } from '../db/index.js';
import { products, categories, transactions, transactionItems } from '../db/schema.js';
import { eq, lte, sql, desc, and, gte } from 'drizzle-orm';
import { memoryStore } from '../db/store.js';

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
    // period: 'daily' | 'weekly' | 'monthly' | 'yearly' | 'custom'
    // dateFrom, dateTo: ISO date strings (optional for custom)
    const now = new Date();
    let dateFrom: Date;
    let dateTo: Date = new Date(now);
    dateTo.setHours(23, 59, 59, 999);

    const period = query?.period || 'daily';

    if (period === 'daily') {
      dateFrom = new Date(now);
      dateFrom.setHours(0, 0, 0, 0);
    } else if (period === 'weekly') {
      dateFrom = new Date(now);
      dateFrom.setDate(now.getDate() - 6);
      dateFrom.setHours(0, 0, 0, 0);
    } else if (period === 'monthly') {
      dateFrom = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    } else if (period === 'yearly') {
      dateFrom = new Date(now.getFullYear(), 0, 1, 0, 0, 0, 0);
    } else {
      // custom
      dateFrom = query?.dateFrom ? new Date(query.dateFrom + 'T00:00:00') : new Date(now.getFullYear(), now.getMonth(), 1);
      dateTo = query?.dateTo ? new Date(query.dateTo + 'T23:59:59') : new Date(dateTo);
    }

    return await getRevenueData(dateFrom, dateTo, period);
  });

async function getDashboardData(dateFrom: Date | null, dateTo: Date | null) {
  try {
    // 1. Fetch DB Products with Low Stock
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

    // 2. Fetch DB Top Selling Products from transactionItems (with optional date filter)
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

    // 3. Fetch DB Metrics (with optional date filter)
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

    // Fetch product catalog for costPrice fallback if historical item costPrice is 0
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
    console.warn('DB analytics error, fallback to memoryStore calculations:', e.message);
  }

  // Fallback to memoryStore dynamic calculation
  return getMemoryStoreAnalytics(dateFrom, dateTo);
}

async function getRevenueData(dateFrom: Date, dateTo: Date, period: string) {
  // Generate daily breakdown labels
  const dayLabels: string[] = [];
  const current = new Date(dateFrom);
  while (current <= dateTo) {
    dayLabels.push(current.toISOString().slice(0, 10));
    current.setDate(current.getDate() + 1);
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

    return buildRevenueResult(allTrx, itemMap, dayLabels, dateFrom, dateTo, period);
  } catch (e: any) {
    console.warn('DB revenue error, fallback memoryStore:', e.message);
  }

  // Fallback from memoryStore
  const allTrx = memoryStore.transactions.filter((t: any) => {
    const d = new Date(t.createdAt);
    return d >= dateFrom && d <= dateTo;
  });
  const itemMap = new Map<string, any[]>();
  for (const t of allTrx as any[]) {
    itemMap.set(t.id, t.items || []);
  }
  return buildRevenueResult(allTrx, itemMap, dayLabels, dateFrom, dateTo, period);
}

function buildRevenueResult(allTrx: any[], itemMap: Map<string, any[]>, dayLabels: string[], dateFrom: Date, dateTo: Date, period: string) {
  // Build product cost map for historical fallback
  const prodCostMap = new Map(memoryStore.products.map(p => [p.id, Number(p.costPrice || 0)]));
  const prodNameCostMap = new Map(memoryStore.products.map(p => [p.name, Number(p.costPrice || 0)]));

  // Aggregate by day
  const byDay = new Map<string, { omset: number; profit: number; count: number }>();
  for (const label of dayLabels) {
    byDay.set(label, { omset: 0, profit: 0, count: 0 });
  }

  let totalOmset = 0;
  let totalCost = 0;
  let totalTransactions = 0;

  for (const t of allTrx) {
    const dayKey = new Date(t.createdAt).toISOString().slice(0, 10);
    const omset = Number(t.grandTotal || 0);
    const items = itemMap.get(t.id) || [];
    const cost = items.reduce((acc: number, i: any) => {
      let c = Number(i.costPrice || 0);
      if (c === 0) {
        c = prodCostMap.get(i.productId || '') || prodNameCostMap.get(i.productName || i.name || '') || (Number(i.sellPrice || i.price || 0) * 0.8);
      }
      return acc + (c * Number(i.quantity || i.qty || 1));
    }, 0);
    const profit = omset - cost;

    const day = byDay.get(dayKey) || { omset: 0, profit: 0, count: 0 };
    day.omset += omset;
    day.profit += profit;
    day.count += 1;
    byDay.set(dayKey, day);

    totalOmset += omset;
    totalCost += cost;
    totalTransactions += 1;
  }

  const netProfit = totalOmset - totalCost;
  const averageOrderValue = totalTransactions > 0 ? Math.round(totalOmset / totalTransactions) : 0;

  const chartData = Array.from(byDay.entries()).map(([date, v]) => ({
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
}

function getMemoryStoreAnalytics(dateFrom: Date | null, dateTo: Date | null) {
  const catMap = new Map(memoryStore.categories.map(c => [c.id, c.name]));
  const prodMap = new Map(memoryStore.products.map(p => [p.id, p]));

  const filteredTrx = dateFrom && dateTo
    ? memoryStore.transactions.filter((t: any) => {
        const d = new Date(t.createdAt);
        return d >= dateFrom && d <= dateTo;
      })
    : memoryStore.transactions;

  // Calculate Low Stock Alerts
  const lowStockAlerts = memoryStore.products
    .filter(p => p.stock <= (p.minStockAlert || 5))
    .slice(0, 10)
    .map(p => ({
      name: p.name,
      stock: p.stock,
      minAlert: p.minStockAlert || 5,
      category: catMap.get(p.categoryId || '') || 'Umum'
    }));

  // Calculate Top Selling Products from transactions
  const productSales = new Map<string, { name: string; category: string; soldQty: number; revenue: number }>();

  for (const trx of filteredTrx) {
    for (const item of ((trx as any).items || [])) {
      const existing = productSales.get(item.productName) || {
        name: item.productName,
        category: 'Umum',
        soldQty: 0,
        revenue: 0
      };

      const prod = prodMap.get(item.productId);
      if (prod && prod.categoryId) {
        existing.category = catMap.get(prod.categoryId) || 'Umum';
      }

      const itemQty = Number(item.quantity || 0);
      const itemSellPrice = Number(item.sellPrice || 0);
      const itemSubtotal = item.subtotal ? Number(item.subtotal) : (itemQty * itemSellPrice);

      existing.soldQty += itemQty;
      existing.revenue += itemSubtotal;
      productSales.set(item.productName, existing);
    }
  }

  const sortedTopProducts = Array.from(productSales.values())
    .sort((a, b) => b.soldQty - a.soldQty)
    .slice(0, 5);

  const totalOmset = (filteredTrx as any[]).reduce((acc, t) => acc + Number(t.grandTotal || 0), 0);
  const prodCostMap = new Map(memoryStore.products.map(p => [p.id, Number(p.costPrice || 0)]));
  const prodNameCostMap = new Map(memoryStore.products.map(p => [p.name, Number(p.costPrice || 0)]));

  const totalCost = (filteredTrx as any[]).reduce((acc, t) => {
    const itemCost = (t.items || []).reduce((iAcc: number, item: any) => {
      let c = Number(item.costPrice || 0);
      if (c === 0) {
        c = prodCostMap.get(item.productId || '') || prodNameCostMap.get(item.productName || item.name || '') || (Number(item.sellPrice || item.price || 0) * 0.8);
      }
      return iAcc + (c * Number(item.quantity || item.qty || 1));
    }, 0);
    return acc + itemCost;
  }, 0);
  const netProfit = totalOmset - totalCost;
  const totalTransactions = (filteredTrx as any[]).length;
  const averageOrderValue = totalTransactions > 0 ? Math.round(totalOmset / totalTransactions) : 0;

  return {
    success: true,
    data: {
      totalOmset,
      netProfit,
      totalTransactions,
      averageOrderValue,
      topProducts: sortedTopProducts,
      lowStockAlerts
    }
  };
}
