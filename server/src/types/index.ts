// Server-side type definitions
import { Request } from 'express';

// Extend Express Request to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    name: string;
    email: string;
    roleId?: number;
    profileImageUrl?: string;
  };
}

// User management types
export interface CreateUserRequest {
  name: string;
  email: string;
  firstName?: string;
  lastName?: string;
  roleId: number;
  password?: string;
}

export interface UpdateUserRequest extends Partial<CreateUserRequest> {
  id: string;
}

// Service response pattern
export interface ServiceResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Pagination parameters
export interface PaginationParams {
  page?: number;
  limit?: number;
  search?: string;
}

// Generic filter interface
export interface FilterParams {
  [key: string]: any;
}

// API Response format
export interface ApiResponse<T = any> {
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// Database operation result
export interface DatabaseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Sale request types
export interface SaleRequest {
  totalAmount: number;
  paidAmount: number;
  status?: 'pending' | 'completed' | 'cancelled';
  customerId?: number;
  branchId?: number;
  saleDate?: string;
  items?: SaleItemRequest[];
}

export interface SaleItemRequest {
  productId: number;
  quantity: number;
  price: number;
  unitPrice?: number;
  discount?: number;
  id?: number;
}

// Activity log interface
export interface ActivityLog {
  id: string;
  action: string;
  details: string;
  userId?: number;
  timestamp: Date;
}