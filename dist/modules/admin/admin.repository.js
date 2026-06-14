"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminRepository = void 0;
const client_1 = require("@prisma/client");
const database_1 = __importDefault(require("../../config/database"));
class AdminRepository {
    /**
     * Fetches dashboard statistics counts.
     */
    async getDashboardStats() {
        const [totalUsers, totalVehicles, totalActiveVehicles, totalBookings, totalCompletedBookings, totalPendingBookings,] = await database_1.default.$transaction([
            database_1.default.user.count(),
            database_1.default.vehicle.count(),
            database_1.default.vehicle.count({ where: { status: client_1.VehicleStatus.ACTIVE } }),
            database_1.default.booking.count(),
            database_1.default.booking.count({ where: { status: client_1.BookingStatus.COMPLETED } }),
            database_1.default.booking.count({ where: { status: client_1.BookingStatus.PENDING } }),
        ]);
        return {
            totalUsers,
            totalVehicles,
            totalActiveVehicles,
            totalBookings,
            totalCompletedBookings,
            totalPendingBookings,
        };
    }
    /**
     * Retrieves a paginated, filtered list of users sorted newest first.
     */
    async listUsers(dto) {
        const { page, limit, email, name } = dto;
        const where = {};
        if (email) {
            where.email = { contains: email, mode: 'insensitive' };
        }
        if (name) {
            where.name = { contains: name, mode: 'insensitive' };
        }
        const [total, users] = await database_1.default.$transaction([
            database_1.default.user.count({ where }),
            database_1.default.user.findMany({
                where,
                select: {
                    id: true,
                    email: true,
                    phone: true,
                    name: true,
                    role: true,
                    isEmailVerified: true,
                    avatar: true,
                    isBlocked: true,
                    createdAt: true,
                    updatedAt: true,
                },
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { total, users };
    }
    /**
     * Returns detailed user profile info by ID (excluding password).
     */
    async getUserById(id) {
        return database_1.default.user.findUnique({
            where: { id },
            select: {
                id: true,
                email: true,
                phone: true,
                name: true,
                role: true,
                isEmailVerified: true,
                avatar: true,
                isBlocked: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    /**
     * Updates user block/unblock flag.
     */
    async updateUserBlockStatus(id, isBlocked) {
        return database_1.default.user.update({
            where: { id },
            data: { isBlocked },
            select: {
                id: true,
                email: true,
                phone: true,
                name: true,
                role: true,
                isEmailVerified: true,
                avatar: true,
                isBlocked: true,
                createdAt: true,
                updatedAt: true,
            },
        });
    }
    /**
     * Retrieves a paginated, filtered list of vehicles sorted newest first.
     */
    async listVehicles(dto) {
        const { page, limit, status, city, brand } = dto;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (city) {
            where.city = { contains: city, mode: 'insensitive' };
        }
        if (brand) {
            where.brand = { contains: brand, mode: 'insensitive' };
        }
        const [total, vehicles] = await database_1.default.$transaction([
            database_1.default.vehicle.count({ where }),
            database_1.default.vehicle.findMany({
                where,
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
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { total, vehicles };
    }
    /**
     * Returns vehicle details.
     */
    async getVehicleById(id) {
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
     * Updates vehicle status.
     */
    async updateVehicleStatus(id, status) {
        return database_1.default.vehicle.update({
            where: { id },
            data: { status },
        });
    }
    /**
     * Retrieves a paginated, filtered list of bookings sorted newest first.
     */
    async listBookings(dto) {
        const { page, limit, status, vehicleId, customerId } = dto;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (vehicleId) {
            where.vehicleId = vehicleId;
        }
        if (customerId) {
            where.customerId = customerId;
        }
        const [total, bookings] = await database_1.default.$transaction([
            database_1.default.booking.count({ where }),
            database_1.default.booking.findMany({
                where,
                include: {
                    vehicle: {
                        include: {
                            images: true,
                        },
                    },
                    customer: {
                        select: {
                            id: true,
                            name: true,
                            email: true,
                            phone: true,
                            avatar: true,
                        },
                    },
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
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { total, bookings };
    }
    /**
     * Returns booking details.
     */
    async getBookingById(id) {
        return database_1.default.booking.findUnique({
            where: { id },
            include: {
                vehicle: {
                    include: {
                        images: true,
                    },
                },
                customer: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                        avatar: true,
                    },
                },
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
}
exports.AdminRepository = AdminRepository;
exports.default = AdminRepository;
