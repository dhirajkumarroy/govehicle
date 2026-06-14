"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingRepository = void 0;
const client_1 = require("@prisma/client");
const database_1 = __importDefault(require("../../config/database"));
class BookingRepository {
    /**
     * Inserts a new booking record.
     */
    async create(customerId, ownerId, totalDays, totalAmount, dto) {
        return database_1.default.booking.create({
            data: {
                vehicleId: dto.vehicleId,
                customerId,
                ownerId,
                startDate: dto.startDate,
                endDate: dto.endDate,
                totalDays,
                totalAmount,
                status: client_1.BookingStatus.PENDING,
                notes: dto.notes ?? null,
            },
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
    /**
     * Find booking details by UUID, including associated relations.
     */
    async findById(id) {
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
    /**
     * Queries if any overlapping active (PENDING or CONFIRMED) bookings exist.
     * Overlap is detected if: S_new <= E_old AND E_new >= S_old
     */
    async findConflictingBooking(vehicleId, startDate, endDate) {
        return database_1.default.booking.findFirst({
            where: {
                vehicleId,
                status: { in: [client_1.BookingStatus.PENDING, client_1.BookingStatus.CONFIRMED] },
                startDate: { lte: endDate },
                endDate: { gte: startDate },
            },
        });
    }
    /**
     * Lists paginated bookings requested by a specific customer.
     */
    async listByCustomer(customerId, page, limit) {
        const where = { customerId };
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
     * Lists paginated bookings received by a specific owner.
     */
    async listByOwner(ownerId, page, limit) {
        const where = { ownerId };
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
     * Updates the status parameter on a booking record.
     */
    async updateStatus(id, status) {
        return database_1.default.booking.update({
            where: { id },
            data: { status },
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
                    },
                },
                owner: {
                    select: {
                        id: true,
                        name: true,
                        email: true,
                        phone: true,
                    },
                },
            },
        });
    }
}
exports.BookingRepository = BookingRepository;
exports.default = BookingRepository;
