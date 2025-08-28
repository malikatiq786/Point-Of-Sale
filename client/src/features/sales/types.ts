export interface Sale {
  id: number;
  customerId?: number;
  userId: string;
  branchId?: number;
  registerId?: number;
  totalAmount: number;
  paidAmount: number;
  saleDate: string;
  status: string;
}

export interface SaleItem {
  id: number;
  saleId: number;
  productVariantId: number;
  quantity: number;
  price: number;
}

export interface CartItem {
  id: number | string;
  productId?: number;
  variantId?: number;
  name: string;
  baseName?: string;
  variantName?: string;
  price: number;
  quantity: number;
  total: number;
  discount?: number;
  discountType?: 'percentage' | 'fixed';
  tax?: number;
  category?: string;
  isVariant?: boolean;
}

export interface PaymentMethod {
  id: string;
  name: string;
  type: 'cash' | 'card' | 'mobile' | 'credit';
}