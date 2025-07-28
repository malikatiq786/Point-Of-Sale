export interface Customer {
  id: number;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
}

export interface CustomerLedger {
  id: number;
  customerId: number;
  amount: number;
  type: 'debit' | 'credit';
  reference: string;
  date: string;
}