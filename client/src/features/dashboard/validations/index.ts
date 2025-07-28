import { z } from 'zod';

export const quickSaleSchema = z.object({
  customerId: z.number().optional(),
  items: z.array(z.object({
    productVariantId: z.number(),
    quantity: z.number().min(1),
    price: z.number().min(0)
  })).min(1),
  paymentMethod: z.string(),
  totalAmount: z.number().min(0)
});

export type QuickSaleFormData = z.infer<typeof quickSaleSchema>;