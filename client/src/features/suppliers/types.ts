export interface Supplier {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface SupplierLedger {
  id: number;
  supplierId: number;
  amount: number;
  type: 'debit' | 'credit';
  reference: string;
  date: string;
}