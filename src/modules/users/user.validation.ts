import { z } from 'zod';

export const updateProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Name must be at least 2 characters long')
    .max(100, 'Name cannot exceed 100 characters')
    .optional(),
  
  phone: z
    .string()
    .trim()
    .min(10, 'Phone number must be at least 10 digits')
    .max(15, 'Phone number cannot exceed 15 digits')
    .regex(/^\+?\d+$/, 'Phone number must contain only digits (optionally starting with +)')
    .optional(),
});
