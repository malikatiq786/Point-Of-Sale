import { z } from 'zod';

export const purchaseSchema = z.object({
  supplierId: z.number({ required_error: 'Supplier is required' }),
  items: z.array(z.object({
    productVariantId: z.number(),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    costPrice: z.number().min(0, 'Cost price cannot be negative')
  })).min(1, 'At least one item is required'),
  totalAmount: z.number().min(0, 'Total amount cannot be negative'),
  purchaseDate: z.string().min(1, 'Purchase date is required'),
});

export type PurchaseFormData = z.infer<typeof purchaseSchema>;