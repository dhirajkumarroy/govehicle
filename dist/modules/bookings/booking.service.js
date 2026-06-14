"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const client_1 = require("@prisma/client");
const booking_repository_1 = require("./booking.repository");
const vehicle_repository_1 = require("../vehicles/vehicle.repository");
const app_error_1 = require("../../common/utils/app-error");
const logger_1 = __importDefault(require("../../config/logger"));
class BookingService {
    bookingRepository;
    vehicleRepository;
    constructor() {
        this.bookingRepository = new booking_repository_1.BookingRepository();
        this.vehicleRepository = new vehicle_repository_1.VehicleRepository();
    }
    /**
     * Creates a new booking entry after validating availability, conflicts, and self-booking blocks.
     */
    async createBooking(customerId, dto) {
        logger_1.default.info(`BookingService: Customer ${customerId} attempting to book vehicle ${dto.vehicleId}`);
        // 1. Fetch vehicle listing and verify active/available status
        const vehicle = await this.vehicleRepository.findById(dto.vehicleId);
        if (!vehicle) {
            throw new app_error_1.NotFoundError('Vehicle not found.');
        }
        if (vehicle.status !== 'ACTIVE' || !vehicle.isAvailable) {
            throw new app_error_1.BadRequestError('This vehicle is currently not active or available for booking.');
        }
        // 2. Prevent owners booking their own vehicle listings
        if (vehicle.ownerId === customerId) {
            throw new app_error_1.BadRequestError('You cannot book your own vehicle listing.');
        }
        // 3. Prevent date range overlaps with active reservations
        const conflict = await this.bookingRepository.findConflictingBooking(dto.vehicleId, dto.startDate, dto.endDate);
        if (conflict) {
            throw new app_error_1.ConflictError('The vehicle is already booked for the selected date range.');
        }
        // 4. Calculate total days and amounts
        const msPerDay = 1000 * 60 * 60 * 24;
        const timeDiff = dto.endDate.getTime() - dto.startDate.getTime();
        const totalDays = Math.ceil(timeDiff / msPerDay);
        if (totalDays <= 0) {
            throw new app_error_1.BadRequestError('Booking duration must be at least 1 day.');
        }
        const totalAmount = totalDays * vehicle.pricePerDay;
        // 5. Commit record
        const booking = await this.bookingRepository.create(customerId, vehicle.ownerId, totalDays, totalAmount, dto);
        logger_1.default.info(`BookingService: Booking ${booking.id} created successfully`);
        return booking;
    }
    /**
     * Retrieves booking details if requested by customer, owner, or ADMIN.
     */
    async getBookingDetails(id, userId, userRole) {
        logger_1.default.info(`BookingService: Retrieving details of booking ${id} for user ${userId}`);
        const booking = await this.bookingRepository.findById(id);
        if (!booking) {
            throw new app_error_1.NotFoundError('Booking not found.');
        }
        // Access authorization: Customer, Owner, or Admin
        if (booking.customerId !== userId &&
            booking.ownerId !== userId &&
            userRole !== client_1.Role.ADMIN) {
            throw new app_error_1.ForbiddenError('You are not authorized to view this booking.');
        }
        return booking;
    }
    /**
     * Confirms a PENDING booking. Owner only.
     */
    async confirmBooking(id, ownerId, userRole) {
        logger_1.default.info(`BookingService: Confirm request for booking ${id} by owner ${ownerId}`);
        const booking = await this.bookingRepository.findById(id);
        if (!booking) {
            throw new app_error_1.NotFoundError('Booking not found.');
        }
        // Owner authorization check
        if (booking.ownerId !== ownerId && userRole !== client_1.Role.ADMIN) {
            throw new app_error_1.ForbiddenError('Only the vehicle owner can confirm this booking.');
        }
        // Status transition check
        if (booking.status !== client_1.BookingStatus.PENDING) {
            throw new app_error_1.BadRequestError('Only pending bookings can be confirmed.');
        }
        const updatedBooking = await this.bookingRepository.updateStatus(id, client_1.BookingStatus.CONFIRMED);
        logger_1.default.info(`BookingService: Booking ${id} successfully confirmed`);
        return updatedBooking;
    }
    /**
     * Rejects a PENDING booking. Owner only.
     */
    async rejectBooking(id, ownerId, userRole) {
        logger_1.default.info(`BookingService: Reject request for booking ${id} by owner ${ownerId}`);
        const booking = await this.bookingRepository.findById(id);
        if (!booking) {
            throw new app_error_1.NotFoundError('Booking not found.');
        }
        // Owner authorization check
        if (booking.ownerId !== ownerId && userRole !== client_1.Role.ADMIN) {
            throw new app_error_1.ForbiddenError('Only the vehicle owner can reject this booking.');
        }
        // Status transition check
        if (booking.status !== client_1.BookingStatus.PENDING) {
            throw new app_error_1.BadRequestError('Only pending bookings can be rejected.');
        }
        const updatedBooking = await this.bookingRepository.updateStatus(id, client_1.BookingStatus.REJECTED);
        logger_1.default.info(`BookingService: Booking ${id} successfully rejected`);
        return updatedBooking;
    }
    /**
     * Cancels a PENDING or CONFIRMED booking. Customer only.
     */
    async cancelBooking(id, customerId, userRole) {
        logger_1.default.info(`BookingService: Cancel request for booking ${id} by customer ${customerId}`);
        const booking = await this.bookingRepository.findById(id);
        if (!booking) {
            throw new app_error_1.NotFoundError('Booking not found.');
        }
        // Customer authorization check
        if (booking.customerId !== customerId && userRole !== client_1.Role.ADMIN) {
            throw new app_error_1.ForbiddenError('Only the customer who created this booking can cancel it.');
        }
        // Status transition check: only PENDING or CONFIRMED bookings can be cancelled
        if (booking.status !== client_1.BookingStatus.PENDING &&
            booking.status !== client_1.BookingStatus.CONFIRMED) {
            throw new app_error_1.BadRequestError('Only pending or confirmed bookings can be cancelled.');
        }
        const updatedBooking = await this.bookingRepository.updateStatus(id, client_1.BookingStatus.CANCELLED);
        logger_1.default.info(`BookingService: Booking ${id} successfully cancelled`);
        return updatedBooking;
    }
    /**
     * List bookings requested by the authenticated customer.
     */
    async listCustomerBookings(customerId, page, limit) {
        const { total, bookings } = await this.bookingRepository.listByCustomer(customerId, page, limit);
        const totalPages = Math.ceil(total / limit);
        return {
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
            bookings,
        };
    }
    /**
     * List bookings received by the authenticated owner.
     */
    async listOwnerBookings(ownerId, page, limit) {
        const { total, bookings } = await this.bookingRepository.listByOwner(ownerId, page, limit);
        const totalPages = Math.ceil(total / limit);
        return {
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
            bookings,
        };
    }
}
exports.BookingService = BookingService;
exports.default = BookingService;
