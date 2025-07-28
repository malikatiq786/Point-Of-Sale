import { z } from 'zod';

// Sale validation schemas
export const saleCreateSchema = z.object({
  totalAmount: z.number().positive('Total amount must be positive'),
  paidAmount: z.number().positive('Paid amount must be positive'),
  status: z.enum(['completed', 'pending', 'cancelled']).default('completed'),
  customerId: z.number().optional(),
  items: z.array(z.object({
    productId: z.number().positive('Product ID is required'),
    quantity: z.number().positive('Quantity must be positive'),
    unitPrice: z.number().positive('Unit price must be positive'),
    discount: z.number().min(0).optional(),
  })).optional(),
});

// Product validation schemas  
export const productCreateSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  description: z.string().optional(),
  price: z.number().positive('Price must be positive'),
  categoryId: z.number().optional(),
  brandId: z.number().optional(),
  barcode: z.string().optional(),
  stock: z.number().min(0).default(0),
});

export const productUpdateSchema = productCreateSchema.partial().extend({
  id: z.number().positive('Product ID is required'),
});

// Category validation schemas
export const categoryCreateSchema = z.object({
  name: z.string().min(1, 'Category name is required').max(100),
  description: z.string().optional(),
  parentId: z.number().optional(),
});

// Brand validation schemas
export const brandCreateSchema = z.object({
  name: z.string().min(1, 'Brand name is required').max(100),
  description: z.string().optional(),
});

// Customer validation schemas
export const customerCreateSchema = z.object({
  name: z.string().min(1, 'Customer name is required').max(255),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
});

// Pagination validation schema
export const paginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(10),
  search: z.string().optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

// Query parameter validation
export const searchQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  brand: z.string().optional(),
  minPrice: z.number().min(0).optional(),
  maxPrice: z.number().min(0).optional(),
});

// Sample data initialization schema
export const sampleDataSchema = z.object({
  categories: z.number().min(1).max(20).default(5),
  brands: z.number().min(1).max(20).default(5),
  products: z.number().min(1).max(50).default(8),
});

// Validation helper function
export function validateInput<T>(schema: z.ZodSchema<T>, data: any): { 
  success: boolean; 
  data?: T; 
  errors?: string[] 
} {
  try {
    const result = schema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => 
        `${err.path.join('.')}: ${err.message}`
      );
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}