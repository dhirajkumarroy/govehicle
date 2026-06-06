"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfileSchema = void 0;
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
