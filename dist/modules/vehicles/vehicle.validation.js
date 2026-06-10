"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.vehicleQuerySchema = exports.updateVehicleSchema = exports.createVehicleSchema = void 0;
const zod_1 = require("zod");
const client_1 = require("@prisma/client");
exports.createVehicleSchema = zod_1.z.object({
    title: zod_1.z.string().min(2, 'Title must be at least 2 characters').max(100),
    brand: zod_1.z.string().min(1, 'Brand is required').max(50),
    model: zod_1.z.string().min(1, 'Model is required').max(50),
    year: zod_1.z.coerce.number().int().min(1800).max(new Date().getFullYear() + 1),
    vehicleNumber: zod_1.z.string().min(3, 'Vehicle number must be at least 3 characters').max(30),
    fuelType: zod_1.z.nativeEnum(client_1.FuelType, { errorMap: () => ({ message: 'Invalid fuel type' }) }),
    transmission: zod_1.z.nativeEnum(client_1.Transmission, { errorMap: () => ({ message: 'Invalid transmission type' }) }),
    seatCapacity: zod_1.z.coerce.number().int().positive('Seat capacity must be positive'),
    pricePerDay: zod_1.z.coerce.number().positive('Price per day must be positive'),
    city: zod_1.z.string().min(1, 'City is required').max(100),
    latitude: zod_1.z.coerce.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
    longitude: zod_1.z.coerce.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
    description: zod_1.z.string().min(10, 'Description must be at least 10 characters').max(2000),
});
exports.updateVehicleSchema = exports.createVehicleSchema.partial().extend({
    isAvailable: zod_1.z.preprocess((val) => {
        if (val === 'true' || val === true)
            return true;
        if (val === 'false' || val === false)
            return false;
        return undefined;
    }, zod_1.z.boolean().optional()),
});
exports.vehicleQuerySchema = zod_1.z.object({
    city: zod_1.z.string().optional(),
    brand: zod_1.z.string().optional(),
    fuelType: zod_1.z.nativeEnum(client_1.FuelType).optional(),
    transmission: zod_1.z.nativeEnum(client_1.Transmission).optional(),
    minPrice: zod_1.z.coerce.number().optional(),
    maxPrice: zod_1.z.coerce.number().optional(),
    isAvailable: zod_1.z.preprocess((val) => {
        if (val === 'true' || val === true)
            return true;
        if (val === 'false' || val === false)
            return false;
        return undefined;
    }, zod_1.z.boolean().optional()),
    page: zod_1.z.coerce.number().int().positive().default(1),
    limit: zod_1.z.coerce.number().int().positive().default(10),
    sort: zod_1.z.enum(['newest', 'oldest', 'priceAsc', 'priceDesc']).default('newest'),
});
