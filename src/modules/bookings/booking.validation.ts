import { z } from 'zod';

export const createBookingSchema = z
  .object({
    vehicleId: z.string().uuid('Invalid vehicle ID format.'),
    startDate: z.preprocess((arg) => {
      if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
      return arg;
    }, z.date({ required_error: 'Start date is required.' }).refine((date) => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return date >= today;
    }, { message: 'Start date cannot be in the past.' })),
    endDate: z.preprocess((arg) => {
      if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
      return arg;
    }, z.date({ required_error: 'End date is required.' })),
    notes: z.string().max(1000, 'Notes cannot exceed 1000 characters.').optional(),
  })
  .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after the start date.',
    path: ['endDate'],
  });

export const bookingQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});
