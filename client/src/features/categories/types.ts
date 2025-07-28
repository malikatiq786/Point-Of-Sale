export interface Category {
  id: number;
  name: string;
  parentId?: number;
  description?: string;
}

export interface Brand {
  id: number;
  name: string;
  description?: string;
}