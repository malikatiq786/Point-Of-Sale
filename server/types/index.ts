// Common types used across the server
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

import { Request } from 'express';

// Request types
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    role?: {
      id: number;
      name: string;
    };
  };
}

// Database operation result types
export interface DatabaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Sale related types
export interface SaleRequest {
  totalAmount: number;
  paidAmount: number;
  status: 'completed' | 'pending' | 'cancelled';
  customerId?: number;
  items?: SaleItemRequest[];
}

export interface SaleItemRequest {
  productId: number;
  quantity: number;
  unitPrice: number;
  discount?: number;
}

// Product related types
export interface ProductCreateRequest {
  name: string;
  description?: string;
  price: number;
  categoryId?: number;
  brandId?: number;
  barcode?: string;
  stock?: number;
}

export interface ProductUpdateRequest extends Partial<ProductCreateRequest> {
  id: number;
}

// Dashboard stats types
export interface DashboardStats {
  todaySales: string;
  totalProducts: number;
  totalCustomers: number;
  lowStockItems: number;
}

// Activity log types
export interface ActivityLog {
  id: number;
  action: string;
  details?: string;
  userId?: number;
  timestamp: Date;
}