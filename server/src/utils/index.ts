import { PaginationParams, PaginatedResponse } from '../types';
import { PAGINATION_DEFAULTS } from '../constants';

// Utility function to validate and normalize pagination parameters
export function normalizePagination(params: PaginationParams) {
  const page = Math.max(1, params.page || PAGINATION_DEFAULTS.PAGE);
  const limit = Math.min(
    PAGINATION_DEFAULTS.MAX_LIMIT,
    Math.max(1, params.limit || PAGINATION_DEFAULTS.LIMIT)
  );
  const offset = (page - 1) * limit;

  return { page, limit, offset };
}

// Utility function to create paginated response
export function createPaginatedResponse<T>(
  data: T[],
  total: number,
  page: number,
  limit: number
): PaginatedResponse<T> {
  return {
    data,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

// Utility function to format currency
export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(numAmount)) return '$0.00';
  return `$${numAmount.toFixed(2)}`;
}

// Utility function to generate random ID (for activities, etc.)
export function generateId(): number {
  return Date.now() + Math.floor(Math.random() * 1000);
}

// Utility function to sanitize search query
export function sanitizeSearchQuery(query?: string): string {
  if (!query) return '';
  return query.trim().toLowerCase().replace(/[^\w\s]/gi, '');
}

// Utility function to format date for logging
export function formatLogDate(date: Date = new Date()): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

// Utility function to validate email format
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Utility function to validate required fields
export function validateRequiredFields<T extends Record<string, any>>(
  data: T,
  requiredFields: (keyof T)[]
): { isValid: boolean; missingFields: string[] } {
  const missingFields: string[] = [];
  
  for (const field of requiredFields) {
    if (data[field] === undefined || data[field] === null || data[field] === '') {
      missingFields.push(String(field));
    }
  }
  
  return {
    isValid: missingFields.length === 0,
    missingFields,
  };
}

// Utility function to handle database errors
export function handleDatabaseError(error: any): { message: string; status: number } {
  console.error('Database error:', error);
  
  if (error.code === '23505') { // PostgreSQL unique violation
    return { message: 'Resource already exists', status: 409 };
  }
  
  if (error.code === '23503') { // PostgreSQL foreign key violation
    return { message: 'Referenced resource not found', status: 400 };
  }
  
  return { message: 'Database operation failed', status: 500 };
}