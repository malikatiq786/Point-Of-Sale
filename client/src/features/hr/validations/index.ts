import { z } from 'zod';

export const employeeSchema = z.object({
  name: z.string().min(2, 'Employee name must be at least 2 characters'),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().optional(),
  position: z.string().optional(),
  salary: z.number().min(0, 'Salary cannot be negative').optional(),
  hireDate: z.string().optional(),
});

export const attendanceSchema = z.object({
  employeeId: z.number({ required_error: 'Employee is required' }),
  date: z.string().min(1, 'Date is required'),
  checkIn: z.string().optional(),
  checkOut: z.string().optional(),
  status: z.enum(['present', 'absent', 'late']),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;
export type AttendanceFormData = z.infer<typeof attendanceSchema>;