// Dashboard services - API calls for dashboard data
export const dashboardService = {
  getStats: async () => {
    const response = await fetch('/api/dashboard/stats');
    return response.json();
  },
  getTopProducts: async () => {
    const response = await fetch('/api/dashboard/top-products');
    return response.json();
  },
  getRecentTransactions: async () => {
    const response = await fetch('/api/dashboard/recent-transactions');
    return response.json();
  },
  getActivities: async () => {
    const response = await fetch('/api/dashboard/activities');
    return response.json();
  }
};