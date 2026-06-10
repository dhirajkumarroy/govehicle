"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleRepository = void 0;
const client_1 = require("@prisma/client");
const database_1 = __importDefault(require("../../config/database"));
class VehicleRepository {
    /**
     * Creates a new vehicle record and its associated images in a single database transaction.
     */
    async create(ownerId, dto, images) {
        return database_1.default.$transaction(async (tx) => {
            const vehicle = await tx.vehicle.create({
                data: {
                    ownerId,
                    title: dto.title,
                    brand: dto.brand,
                    model: dto.model,
                    year: dto.year,
                    vehicleNumber: dto.vehicleNumber.toUpperCase().trim(),
                    fuelType: dto.fuelType,
                    transmission: dto.transmission,
                    seatCapacity: dto.seatCapacity,
                    pricePerDay: dto.pricePerDay,
                    city: dto.city,
                    latitude: dto.latitude,
                    longitude: dto.longitude,
                    description: dto.description,
                    status: client_1.VehicleStatus.PENDING,
                    isAvailable: true,
                },
            });
            if (images.length > 0) {
                await tx.vehicleImage.createMany({
                    data: images.map((img) => ({
                        vehicleId: vehicle.id,
                        imageUrl: img.imageUrl,
                        isPrimary: img.isPrimary,
                    })),
                });
            }
            // Return the created vehicle with its images and owner information
            return tx.vehicle.findUnique({
                where: { id: vehicle.id },
                include: {
                    images: true,
                    owner: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            avatar: true,
                        },
                    },
                },
            });
        });
    }
    /**
     * Find vehicle by database ID.
     */
    async findById(id) {
        return database_1.default.vehicle.findUnique({
            where: { id },
            include: {
                images: true,
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                    },
                },
            },
        });
    }
    /**
     * Find vehicle by its unique license plate/number.
     */
    async findByVehicleNumber(vehicleNumber) {
        return database_1.default.vehicle.findUnique({
            where: { vehicleNumber: vehicleNumber.toUpperCase().trim() },
        });
    }
    /**
     * Updates partial data on a vehicle record.
     */
    async update(id, data) {
        return database_1.default.vehicle.update({
            where: { id },
            data,
            include: {
                images: true,
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                    },
                },
            },
        });
    }
    /**
     * List vehicles matching filters, pagination and sorting.
     * Public search only shows ACTIVE listings.
     */
    async list(query) {
        const { city, brand, fuelType, transmission, minPrice, maxPrice, isAvailable, page, limit, sort, } = query;
        const whereClause = {
            status: client_1.VehicleStatus.ACTIVE, // Public catalog filters inactive ones out
        };
        if (city) {
            whereClause.city = { contains: city, mode: 'insensitive' };
        }
        if (brand) {
            whereClause.brand = { contains: brand, mode: 'insensitive' };
        }
        if (fuelType) {
            whereClause.fuelType = fuelType;
        }
        if (transmission) {
            whereClause.transmission = transmission;
        }
        if (isAvailable !== undefined) {
            whereClause.isAvailable = isAvailable;
        }
        if (minPrice !== undefined || maxPrice !== undefined) {
            whereClause.pricePerDay = {};
            if (minPrice !== undefined) {
                whereClause.pricePerDay.gte = minPrice;
            }
            if (maxPrice !== undefined) {
                whereClause.pricePerDay.lte = maxPrice;
            }
        }
        const orderBy = {};
        if (sort === 'newest') {
            orderBy.createdAt = 'desc';
        }
        else if (sort === 'oldest') {
            orderBy.createdAt = 'asc';
        }
        else if (sort === 'priceAsc') {
            orderBy.pricePerDay = 'asc';
        }
        else if (sort === 'priceDesc') {
            orderBy.pricePerDay = 'desc';
        }
        const [total, vehicles] = await database_1.default.$transaction([
            database_1.default.vehicle.count({ where: whereClause }),
            database_1.default.vehicle.findMany({
                where: whereClause,
                include: {
                    images: true,
                    owner: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            avatar: true,
                        },
                    },
                },
                orderBy,
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { total, vehicles };
    }
    /**
     * Lists all vehicles registered to a specific owner.
     */
    async listByOwner(ownerId, page, limit) {
        const whereClause = {
            ownerId,
        };
        const [total, vehicles] = await database_1.default.$transaction([
            database_1.default.vehicle.count({ where: whereClause }),
            database_1.default.vehicle.findMany({
                where: whereClause,
                include: {
                    images: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { total, vehicles };
    }
}
exports.VehicleRepository = VehicleRepository;
exports.default = VehicleRepository;
