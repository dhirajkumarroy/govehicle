"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bookingQuerySchema = exports.createBookingSchema = void 0;
const zod_1 = require("zod");
exports.createBookingSchema = zod_1.z
    .object({
    vehicleId: zod_1.z.string().uuid('Invalid vehicle ID format.'),
    startDate: zod_1.z.preprocess((arg) => {
        if (typeof arg === 'string' || arg instanceof Date)
            return new Date(arg);
        return arg;
    }, zod_1.z.date({ required_error: 'Start date is required.' }).refine((date) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        return date >= today;
    }, { message: 'Start date cannot be in the past.' })),
    endDate: zod_1.z.preprocess((arg) => {
        if (typeof arg === 'string' || arg instanceof Date)
            return new Date(arg);
        return arg;
    }, zod_1.z.date({ required_error: 'End date is required.' })),
    notes: zod_1.z.string().max(1000, 'Notes cannot exceed 1000 characters.').optional(),
})
    .refine((data) => data.endDate > data.startDate, {
    message: 'End date must be after the start date.',
    path: ['endDate'],
});
exports.bookingQuerySchema = zod_1.z.object({
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().default(10),
});
