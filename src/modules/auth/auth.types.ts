import { z } from 'zod';
import { registerSchema, loginSchema, verifyEmailSchema, refreshTokenSchema } from './auth.validation';

export type RegisterRequestDto = z.infer<typeof registerSchema>;
export type LoginRequestDto = z.infer<typeof loginSchema>;
export type VerifyEmailRequestDto = z.infer<typeof verifyEmailSchema>;
export type RefreshTokenRequestDto = z.infer<typeof refreshTokenSchema>;



