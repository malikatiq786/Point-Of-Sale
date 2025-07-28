// Customer services - API calls for customer management
export const customerService = {
  getAll: async () => {
    const response = await fetch('/api/customers');
    return response.json();
  },
  getById: async (id: number) => {
    const response = await fetch(`/api/customers/${id}`);
    return response.json();
  },
  create: async (data: any) => {
    const response = await fetch('/api/customers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  update: async (id: number, data: any) => {
    const response = await fetch(`/api/customers/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  delete: async (id: number) => {
    const response = await fetch(`/api/customers/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  }
};