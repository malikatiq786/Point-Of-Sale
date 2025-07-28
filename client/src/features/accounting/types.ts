export interface Account {
  id: number;
  name: string;
  type: string;
}

export interface Transaction {
  id: number;
  accountId: number;
  type: 'debit' | 'credit';
  amount: number;
  reference: string;
  date: string;
}

export interface Payment {
  id: number;
  accountId: number;
  amount: number;
  paymentType: string;
  reference: string;
  date: string;
}