export interface Purchase {
  id: number;
  supplierId: number;
  userId: string;
  totalAmount: number;
  purchaseDate: string;
  status: string;
}

export interface PurchaseItem {
  id: number;
  purchaseId: number;
  productVariantId: number;
  quantity: number;
  costPrice: number;
}