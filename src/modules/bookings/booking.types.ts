import { z } from 'zod';
import { createBookingSchema, bookingQuerySchema } from './booking.validation';

export type CreateBookingDto = z.infer<typeof createBookingSchema>;
export type BookingQueryDto = z.infer<typeof bookingQuerySchema>;
