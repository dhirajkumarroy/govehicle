import { Response, NextFunction } from 'express';
import { BookingService } from './booking.service';
import { createBookingSchema, bookingQuerySchema } from './booking.validation';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { UnauthorizedError, BadRequestError } from '../../common/utils/app-error';
import logger from '../../config/logger';

export class BookingController {
  private bookingService: BookingService;

  constructor() {
    this.bookingService = new BookingService();
  }

  /**
   * Request booking registration.
   * POST /api/v1/bookings
   */
  createBooking = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      // Parse payload inputs
      const validatedBody = createBookingSchema.parse(req.body);

      const booking = await this.bookingService.createBooking(userId, validatedBody);

      res.status(201).json(
        ResponseDto.success('Booking requested successfully.', booking)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieve details of a booking listing.
   * GET /api/v1/bookings/:id
   */
  getBookingDetails = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Booking ID is required.');
      }

      const booking = await this.bookingService.getBookingDetails(id, userId, role);

      res.status(200).json(
        ResponseDto.success('Booking details retrieved successfully.', booking)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Confirms a pending booking. Owner only.
   * PATCH /api/v1/bookings/:id/confirm
   */
  confirmBooking = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Booking ID is required.');
      }

      const booking = await this.bookingService.confirmBooking(id, userId, role);

      res.status(200).json(
        ResponseDto.success('Booking confirmed successfully.', booking)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Rejects a pending booking. Owner only.
   * PATCH /api/v1/bookings/:id/reject
   */
  rejectBooking = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Booking ID is required.');
      }

      const booking = await this.bookingService.rejectBooking(id, userId, role);

      res.status(200).json(
        ResponseDto.success('Booking rejected successfully.', booking)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Cancels a pending/confirmed booking. Customer only.
   * PATCH /api/v1/bookings/:id/cancel
   */
  cancelBooking = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      const role = req.user?.role;
      if (!userId || !role) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const { id } = req.params;
      if (!id) {
        throw new BadRequestError('Booking ID is required.');
      }

      const booking = await this.bookingService.cancelBooking(id, userId, role);

      res.status(200).json(
        ResponseDto.success('Booking cancelled successfully.', booking)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieve bookings made by the authenticated customer.
   * GET /api/v1/bookings/my
   */
  listCustomerBookings = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const query = bookingQuerySchema.parse(req.query);
      const result = await this.bookingService.listCustomerBookings(userId, query.page, query.limit);

      res.status(200).json(
        ResponseDto.success('Customer bookings retrieved successfully.', result)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * Retrieve bookings received by the authenticated owner.
   * GET /api/v1/bookings/owner
   */
  listOwnerBookings = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        throw new UnauthorizedError('Unauthorized access.');
      }

      const query = bookingQuerySchema.parse(req.query);
      const result = await this.bookingService.listOwnerBookings(userId, query.page, query.limit);

      res.status(200).json(
        ResponseDto.success('Owner bookings retrieved successfully.', result)
      );
    } catch (error) {
      next(error);
    }
  };
}

export default BookingController;
