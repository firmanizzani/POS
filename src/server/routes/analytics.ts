import { Elysia } from 'elysia';

export const analyticsRoutes = new Elysia({ prefix: '/analytics' })
  .get('/summary', () => {
    return {
      success: true,
      data: {
        totalOmset: 15450000,
        netProfit: 3820000,
        totalTransactions: 248,
        averageOrderValue: 62298,
        topProducts: [
          { name: 'Indomie Goreng Original 85g', soldQty: 320, revenue: 1024000 },
          { name: 'Air Mineral Aqua 600ml', soldQty: 215, revenue: 752500 },
          { name: 'Chitato Sapi Panggang 68g', soldQty: 95, revenue: 1045000 },
          { name: 'Milo Powder 3in1 20g', soldQty: 140, revenue: 420000 }
        ],
        salesHourly: [
          { hour: '08:00', sales: 450000 },
          { hour: '10:00', sales: 1200000 },
          { hour: '12:00', sales: 3400000 },
          { hour: '14:00', sales: 2100000 },
          { hour: '16:00', sales: 2800000 },
          { hour: '18:00', sales: 3900000 },
          { hour: '20:00', sales: 1600000 }
        ]
      }
    };
  });
