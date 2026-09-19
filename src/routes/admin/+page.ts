export async function load({ fetch }: { fetch: typeof window.fetch }) {
  try {
    const res = await fetch('/api/analytics/dashboard').then(r => r.json());
    if (res?.success && res.data) {
      return { analytics: res.data };
    }
  } catch (e) {
    console.warn('Page load fetch failed for analytics', e);
  }

  return {
    analytics: {
      totalOmset: 0,
      netProfit: 0,
      totalTransactions: 0,
      averageOrderValue: 0,
      topProducts: [] as any[],
      lowStockAlerts: [] as any[]
    }
  };
}
