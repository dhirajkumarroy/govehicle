import { z } from 'zod';
import {
  registerSchema,
  loginSchema,
  verifyOtpSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
} from './auth.validation';

export type RegisterRequestDto = z.infer<typeof registerSchema>;
export type LoginRequestDto = z.infer<typeof loginSchema>;
export type VerifyOtpRequestDto = z.infer<typeof verifyOtpSchema>;
export type ForgotPasswordRequestDto = z.infer<typeof forgotPasswordSchema>;
export type ResetPasswordRequestDto = z.infer<typeof resetPasswordSchema>;
