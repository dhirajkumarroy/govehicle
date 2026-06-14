"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const booking_service_1 = require("./booking.service");
const booking_validation_1 = require("./booking.validation");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
const app_error_1 = require("../../common/utils/app-error");
class BookingController {
    bookingService;
    constructor() {
        this.bookingService = new booking_service_1.BookingService();
    }
    /**
     * Request booking registration.
     * POST /api/v1/bookings
     */
    createBooking = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new app_error_1.UnauthorizedError('Unauthorized access.');
            }
            // Parse payload inputs
            const validatedBody = booking_validation_1.createBookingSchema.parse(req.body);
            const booking = await this.bookingService.createBooking(userId, validatedBody);
            res.status(201).json(api_response_dto_1.ResponseDto.success('Booking requested successfully.', booking));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Retrieve details of a booking listing.
     * GET /api/v1/bookings/:id
     */
    getBookingDetails = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const role = req.user?.role;
            if (!userId || !role) {
                throw new app_error_1.UnauthorizedError('Unauthorized access.');
            }
            const { id } = req.params;
            if (!id) {
                throw new app_error_1.BadRequestError('Booking ID is required.');
            }
            const booking = await this.bookingService.getBookingDetails(id, userId, role);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Booking details retrieved successfully.', booking));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Confirms a pending booking. Owner only.
     * PATCH /api/v1/bookings/:id/confirm
     */
    confirmBooking = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const role = req.user?.role;
            if (!userId || !role) {
                throw new app_error_1.UnauthorizedError('Unauthorized access.');
            }
            const { id } = req.params;
            if (!id) {
                throw new app_error_1.BadRequestError('Booking ID is required.');
            }
            const booking = await this.bookingService.confirmBooking(id, userId, role);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Booking confirmed successfully.', booking));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Rejects a pending booking. Owner only.
     * PATCH /api/v1/bookings/:id/reject
     */
    rejectBooking = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const role = req.user?.role;
            if (!userId || !role) {
                throw new app_error_1.UnauthorizedError('Unauthorized access.');
            }
            const { id } = req.params;
            if (!id) {
                throw new app_error_1.BadRequestError('Booking ID is required.');
            }
            const booking = await this.bookingService.rejectBooking(id, userId, role);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Booking rejected successfully.', booking));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Cancels a pending/confirmed booking. Customer only.
     * PATCH /api/v1/bookings/:id/cancel
     */
    cancelBooking = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const role = req.user?.role;
            if (!userId || !role) {
                throw new app_error_1.UnauthorizedError('Unauthorized access.');
            }
            const { id } = req.params;
            if (!id) {
                throw new app_error_1.BadRequestError('Booking ID is required.');
            }
            const booking = await this.bookingService.cancelBooking(id, userId, role);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Booking cancelled successfully.', booking));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Retrieve bookings made by the authenticated customer.
     * GET /api/v1/bookings/my
     */
    listCustomerBookings = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new app_error_1.UnauthorizedError('Unauthorized access.');
            }
            const query = booking_validation_1.bookingQuerySchema.parse(req.query);
            const result = await this.bookingService.listCustomerBookings(userId, query.page, query.limit);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Customer bookings retrieved successfully.', result));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Retrieve bookings received by the authenticated owner.
     * GET /api/v1/bookings/owner
     */
    listOwnerBookings = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new app_error_1.UnauthorizedError('Unauthorized access.');
            }
            const query = booking_validation_1.bookingQuerySchema.parse(req.query);
            const result = await this.bookingService.listOwnerBookings(userId, query.page, query.limit);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Owner bookings retrieved successfully.', result));
        }
        catch (error) {
            next(error);
        }
    };
}
exports.BookingController = BookingController;
exports.default = BookingController;
