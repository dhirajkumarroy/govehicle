"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.updateProfileSchema = void 0;
const zod_1 = require("zod");
exports.updateProfileSchema = zod_1.z.object({
    name: zod_1.z
        .string()
        .trim()
        .min(2, 'Name must be at least 2 characters long')
        .max(100, 'Name cannot exceed 100 characters')
        .optional(),
    phone: zod_1.z
        .string()
        .trim()
        .min(10, 'Phone number must be at least 10 digits')
        .max(15, 'Phone number cannot exceed 15 digits')
        .regex(/^\+?\d+$/, 'Phone number must contain only digits (optionally starting with +)')
        .optional(),
});
const passwordComplexity = zod_1.z
    .string({ required_error: 'Password is required' })
    .min(8, 'Password must be at least 8 characters long')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#^()_\-+=\[\]{}|\\:;"'<>,.?/~`]).*$/, 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character');
exports.changePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z
        .string({ required_error: 'Old password is required' })
        .min(1, 'Old password cannot be empty'),
    newPassword: passwordComplexity,
});
