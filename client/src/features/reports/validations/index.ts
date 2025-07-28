import { z } from 'zod';

export const reportFilterSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  type: z.enum(['sales', 'inventory', 'financial', 'customer']),
});

export const salesReportFiltersSchema = z.object({
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  categoryId: z.number().optional(),
  employeeId: z.number().optional(),
});

export type ReportFiltersFormData = z.infer<typeof reportFilterSchema>;
export type SalesReportFiltersFormData = z.infer<typeof salesReportFiltersSchema>;