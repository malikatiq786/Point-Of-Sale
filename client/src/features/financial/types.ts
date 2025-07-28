export interface Payment {
  id: number;
  customerId: number;
  customerName: string;
  amount: number;
  paymentMethod: 'cash' | 'card' | 'bank_transfer' | 'mobile_payment' | 'check';
  paymentType: 'received' | 'sent' | 'refund';
  paymentDate: string;
  status: 'completed' | 'pending' | 'failed';
  description?: string;
  reference?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Account {
  id: number;
  name: string;
  accountCode: string;
  accountType: 'asset' | 'liability' | 'equity' | 'revenue' | 'expense';
  openingBalance: number;
  currentBalance: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Transaction {
  id: number;
  accountId: number;
  accountName: string;
  amount: number;
  transactionType: 'income' | 'expense' | 'transfer' | 'adjustment';
  transactionDate: string;
  description: string;
  reference?: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface FinancialReport {
  reportType: string;
  period: string;
  dateFrom: string;
  dateTo: string;
  data: any;
  generatedAt: string;
}