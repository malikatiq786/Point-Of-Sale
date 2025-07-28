export interface Expense {
  id: number;
  categoryId: number;
  amount: number;
  description?: string;
  date: string;
  userId: string;
}

export interface ExpenseCategory {
  id: number;
  name: string;
  description?: string;
}