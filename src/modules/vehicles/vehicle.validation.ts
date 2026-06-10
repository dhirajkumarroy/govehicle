import { z } from 'zod';
import { FuelType, Transmission } from '@prisma/client';

export const createVehicleSchema = z.object({
  title: z.string().min(2, 'Title must be at least 2 characters').max(100),
  brand: z.string().min(1, 'Brand is required').max(50),
  model: z.string().min(1, 'Model is required').max(50),
  year: z.coerce.number().int().min(1800).max(new Date().getFullYear() + 1),
  vehicleNumber: z.string().min(3, 'Vehicle number must be at least 3 characters').max(30),
  fuelType: z.nativeEnum(FuelType, { errorMap: () => ({ message: 'Invalid fuel type' }) }),
  transmission: z.nativeEnum(Transmission, { errorMap: () => ({ message: 'Invalid transmission type' }) }),
  seatCapacity: z.coerce.number().int().positive('Seat capacity must be positive'),
  pricePerDay: z.coerce.number().positive('Price per day must be positive'),
  city: z.string().min(1, 'City is required').max(100),
  latitude: z.coerce.number().min(-90, 'Latitude must be between -90 and 90').max(90, 'Latitude must be between -90 and 90'),
  longitude: z.coerce.number().min(-180, 'Longitude must be between -180 and 180').max(180, 'Longitude must be between -180 and 180'),
  description: z.string().min(10, 'Description must be at least 10 characters').max(2000),
});

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  isAvailable: z.preprocess(
    (val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    },
    z.boolean().optional()
  ),
});

export const vehicleQuerySchema = z.object({
  city: z.string().optional(),
  brand: z.string().optional(),
  fuelType: z.nativeEnum(FuelType).optional(),
  transmission: z.nativeEnum(Transmission).optional(),
  minPrice: z.coerce.number().optional(),
  maxPrice: z.coerce.number().optional(),
  isAvailable: z.preprocess(
    (val) => {
      if (val === 'true' || val === true) return true;
      if (val === 'false' || val === false) return false;
      return undefined;
    },
    z.boolean().optional()
  ),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().default(10),
  sort: z.enum(['newest', 'oldest', 'priceAsc', 'priceDesc']).default('newest'),
});
