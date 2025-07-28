// Category services - API calls for category management
export const categoryService = {
  getAll: async () => {
    const response = await fetch('/api/categories');
    return response.json();
  },
  create: async (data: any) => {
    const response = await fetch('/api/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  update: async (id: number, data: any) => {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  },
  delete: async (id: number) => {
    const response = await fetch(`/api/categories/${id}`, {
      method: 'DELETE'
    });
    return response.json();
  }
};

export const brandService = {
  getAll: async () => {
    const response = await fetch('/api/brands');
    return response.json();
  },
  create: async (data: any) => {
    const response = await fetch('/api/brands', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
};