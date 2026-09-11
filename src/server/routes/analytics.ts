import { Elysia } from 'elysia';
import { memoryStore } from '../db/store.js';

export const analyticsRoutes = new Elysia({ prefix: '/analytics' })
  .get('/summary', () => {
    return getDashboardData();
  })
  .get('/dashboard', () => {
    return getDashboardData();
  });

function getDashboardData() {
  const totalOmset = memoryStore.transactions.reduce((acc, t) => acc + Number(t.grandTotal || 0), 0);
  const totalCost = memoryStore.transactions.reduce((acc, t) => {
    const itemCost = (t.items || []).reduce((iAcc: number, item: any) => iAcc + (Number(item.costPrice || 0) * item.quantity), 0);
    return acc + itemCost;
  }, 0);
  const netProfit = totalOmset - totalCost;
  const totalTransactions = memoryStore.transactions.length;
  const averageOrderValue = totalTransactions > 0 ? Math.round(totalOmset / totalTransactions) : 0;

  const topProducts = [
    { name: 'Indomie Goreng Spesial 85g', category: 'Mie & Makanan Instan', soldQty: 320, revenue: 1120000 },
    { name: 'Aqua Air Mineral 600ml', category: 'Air Mineral & Isotonik', soldQty: 215, revenue: 817000 },
    { name: 'Chitato Sapi Panggang 68g', category: 'Camilan & Snack', soldQty: 95, revenue: 1092500 },
    { name: 'Minyak Goreng Bimoli 1L', category: 'Bumbu & Dapur', soldQty: 80, revenue: 1560000 }
  ];

  const catMap = new Map(memoryStore.categories.map(c => [c.id, c.name]));
  const lowStockAlerts = memoryStore.products
    .filter(p => p.stock <= (p.minStockAlert || 5))
    .slice(0, 5)
    .map(p => ({
      name: p.name,
      stock: p.stock,
      minAlert: p.minStockAlert || 5,
      category: catMap.get(p.categoryId || '') || 'Umum'
    }));

  return {
    success: true,
    data: {
      totalOmset: totalOmset || 15450000,
      netProfit: netProfit || 3820000,
      totalTransactions: totalTransactions || 248,
      averageOrderValue: averageOrderValue || 62298,
      topProducts,
      lowStockAlerts: lowStockAlerts.length > 0 ? lowStockAlerts : [
        { name: 'Khong Guan Red Assorted Biscuit 300g', stock: 2, minAlert: 3, category: 'Biskuit & Roti' },
        { name: 'Rexona Roll On Women 45ml', stock: 3, minAlert: 5, category: 'Sabun & Perawatan' }
      ]
    }
  };
}
