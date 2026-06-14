import { z } from 'zod';

export const createOrderSchema = z.object({
  bookingId: z.string().uuid('Invalid booking ID format. Must be a valid UUID.'),
});

export const verifyPaymentSchema = z.object({
  razorpayOrderId: z.string({ required_error: 'Razorpay Order ID is required.' }),
  razorpayPaymentId: z.string({ required_error: 'Razorpay Payment ID is required.' }),
  razorpaySignature: z.string({ required_error: 'Razorpay Signature is required.' }),
});

export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid ID format. Must be a valid UUID.'),
});

export const paymentQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
});

