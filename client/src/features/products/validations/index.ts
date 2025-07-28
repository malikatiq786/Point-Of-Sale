import { z } from 'zod';

export const productSchema = z.object({
  name: z.string().min(2, 'Product name must be at least 2 characters'),
  description: z.string().optional(),
  categoryId: z.number().optional(),
  brandId: z.number().optional(),
});

export const productVariantSchema = z.object({
  name: z.string().min(2, 'Variant name must be at least 2 characters'),
  sku: z.string().optional(),
  attributes: z.record(z.string()).optional(),
});

export const stockUpdateSchema = z.object({
  quantity: z.number().min(0, 'Quantity cannot be negative'),
  minimumLevel: z.number().min(0, 'Minimum level cannot be negative'),
});

export type ProductFormData = z.infer<typeof productSchema>;
export type ProductVariantFormData = z.infer<typeof productVariantSchema>;
export type StockUpdateFormData = z.infer<typeof stockUpdateSchema>;