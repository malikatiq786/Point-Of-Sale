import { z } from 'zod';

export const businessProfileSchema = z.object({
  name: z.string().min(2, 'Business name must be at least 2 characters'),
  address: z.string().optional(),
  phone: z.string().optional(),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
  logo: z.string().optional(),
});

export const systemSettingSchema = z.object({
  key: z.string().min(1, 'Setting key is required'),
  value: z.string().min(1, 'Setting value is required'),
  description: z.string().optional(),
});

export type BusinessProfileFormData = z.infer<typeof businessProfileSchema>;
export type SystemSettingFormData = z.infer<typeof systemSettingSchema>;