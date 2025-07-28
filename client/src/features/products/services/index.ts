// Product services - API calls for product management
export const productService = {
  getAll: async () => {
    const response = await fetch('/api/products');
    return response.json();
  },
  getById: async (id: number) => {
    const response = await fetch(`/api/products/${id}`);
    return response.json();
  },
  create: async (data: any) => {
    const response = await fetch('/api/products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  update: async (id: number, data: any) => {
    const response = await fetch(`/api/products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  delete: async (id: number) => {
    const response = await fetch(`/api/products/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  }
};