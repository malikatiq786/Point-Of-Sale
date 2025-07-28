export interface Product {
  id: number;
  name: string;
  description?: string;
  categoryId?: number;
  brandId?: number;
  category?: {
    id: number;
    name: string;
  };
  brand?: {
    id: number;
    name: string;
  };
}

export interface ProductVariant {
  id: number;
  productId: number;
  name: string;
  sku?: string;
  attributes?: Record<string, string>;
}

export interface ProductPrice {
  id: number;
  productVariantId: number;
  priceType: string;
  price: number;
}

export interface StockItem {
  id: number;
  productVariantId: number;
  quantity: number;
  minimumLevel: number;
  warehouseId?: number;
}