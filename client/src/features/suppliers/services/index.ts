// Supplier services - API calls for supplier management
export const supplierService = {
  getAll: async () => {
    const response = await fetch('/api/suppliers');
    return response.json();
  },
  create: async (data: any) => {
    const response = await fetch('/api/suppliers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  update: async (id: number, data: any) => {
    const response = await fetch(`/api/suppliers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};