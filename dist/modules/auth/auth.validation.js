"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPasswordSchema = exports.forgotPasswordSchema = exports.verifyOtpSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
// Shared password complexity validation rules
const passwordComplexity = zod_1.z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=\[\]{}|\\:;"'<>,.?/~`]).*$/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
exports.registerSchema = zod_1.z.object({
    name: zod_1.z
        .string({ required_error: 'Name is required' })
        .trim()
        .min(1, 'Name cannot be empty'),
    email: zod_1.z
        .string({ required_error: 'Email is required' })
        .trim()
        .email('Invalid email address format'),
    phone: zod_1.z
        .string({ required_error: 'Phone number is required' })
        .trim()
        .min(10, 'Phone number must be at least 10 digits')
        .max(15, 'Phone number cannot exceed 15 digits')
        .regex(/^\+?\d+$/, 'Phone number must contain only digits (optionally starting with +)'),
    password: passwordComplexity,
});
exports.loginSchema = zod_1.z.object({
    email: zod_1.z
        .string({ required_error: 'Email is required' })
        .trim()
        .email('Invalid email address format'),
    password: zod_1.z
        .string({ required_error: 'Password is required' })
        .min(1, 'Password cannot be empty'),
});
exports.verifyOtpSchema = zod_1.z.object({
    email: zod_1.z
        .string({ required_error: 'Email is required' })
        .trim()
        .email('Invalid email address format'),
    code: zod_1.z
        .string({ required_error: 'OTP code is required' })
        .regex(/^\d{6}$/, 'OTP code must be exactly 6 digits'),
});
exports.forgotPasswordSchema = zod_1.z.object({
    email: zod_1.z
        .string({ required_error: 'Email is required' })
        .trim()
        .email('Invalid email address format'),
});
exports.resetPasswordSchema = zod_1.z.object({
    email: zod_1.z
        .string({ required_error: 'Email is required' })
        .trim()
        .email('Invalid email address format'),
    code: zod_1.z
        .string({ required_error: 'OTP code is required' })
        .regex(/^\d{6}$/, 'OTP code must be exactly 6 digits'),
    newPassword: passwordComplexity,
});
