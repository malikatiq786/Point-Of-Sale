import { z } from 'zod';

export const accountSchema = z.object({
  name: z.string().min(2, 'Account name must be at least 2 characters'),
  type: z.string().min(1, 'Account type is required'),
});

export const transactionSchema = z.object({
  accountId: z.number({ required_error: 'Account is required' }),
  type: z.enum(['debit', 'credit']),
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  reference: z.string().min(1, 'Reference is required'),
  date: z.string().min(1, 'Date is required'),
});

export type AccountFormData = z.infer<typeof accountSchema>;
export type TransactionFormData = z.infer<typeof transactionSchema>;