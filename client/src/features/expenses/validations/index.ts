import { z } from 'zod';

export const expenseSchema = z.object({
  categoryId: z.number({ required_error: 'Category is required' }),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
});

export const expenseCategorySchema = z.object({
  name: z.string().min(2, 'Category name must be at least 2 characters'),
  description: z.string().optional(),
});

export type ExpenseFormData = z.infer<typeof expenseSchema>;
export type ExpenseCategoryFormData = z.infer<typeof expenseCategorySchema>;