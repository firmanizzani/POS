import type { PageLoad } from './$types';

export const load: PageLoad = async ({ fetch }) => {
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
      topProducts: [],
      lowStockAlerts: []
    }
  };
};
