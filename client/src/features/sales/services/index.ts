// Sales services - API calls for sales management
export const salesService = {
  processSale: async (data: any) => {
    const response = await fetch('/api/sales', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  getAllSales: async () => {
    const response = await fetch('/api/sales');
    return response.json();
  },
  getSaleById: async (id: number) => {
    const response = await fetch(`/api/sales/${id}`);
    return response.json();
  },
  searchProducts: async (query: string) => {
    const response = await fetch(`/api/products/search?q=${encodeURIComponent(query)}`);
    return response.json();
  }
};