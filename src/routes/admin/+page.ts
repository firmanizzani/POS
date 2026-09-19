export async function load({ fetch }: { fetch: typeof window.fetch }) {
  let analytics = {
    totalOmset: 0,
    netProfit: 0,
    totalTransactions: 0,
    averageOrderValue: 0,
    topProducts: [] as any[],
    lowStockAlerts: [] as any[]
  };
  let revenueData = null;

  try {
    const [resAnalytics, resRevenue] = await Promise.all([
      fetch('/api/analytics/dashboard').then(r => r.json()).catch(() => null),
      fetch('/api/analytics/revenue?period=monthly').then(r => r.json()).catch(() => null)
    ]);

    if (resAnalytics?.success && resAnalytics.data) {
      analytics = resAnalytics.data;
    }
    if (resRevenue?.success && resRevenue.data) {
      revenueData = resRevenue.data;
    }
  } catch (e) {
    console.warn('Page load fetch failed for analytics', e);
  }

  return {
    analytics,
    revenueData
  };
}
