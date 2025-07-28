import { z } from 'zod';

export const saleSchema = z.object({
  customerId: z.number().optional(),
  items: z.array(z.object({
    productVariantId: z.number(),
    quantity: z.number().min(1, 'Quantity must be at least 1'),
    price: z.number().min(0, 'Price cannot be negative')
  })).min(1, 'At least one item is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  totalAmount: z.number().min(0, 'Total amount cannot be negative'),
  paidAmount: z.number().min(0, 'Paid amount cannot be negative')
});

export const cartItemSchema = z.object({
  id: z.number(),
  name: z.string(),
  price: z.number().min(0),
  quantity: z.number().min(1),
});

export type SaleFormData = z.infer<typeof saleSchema>;
export type CartItemFormData = z.infer<typeof cartItemSchema>;