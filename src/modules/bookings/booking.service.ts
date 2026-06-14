import { BookingStatus, Role } from '@prisma/client';
import { BookingRepository } from './booking.repository';
import { VehicleRepository } from '../vehicles/vehicle.repository';
import { NotificationService } from '../notifications/notification.service';
import { CreateBookingDto } from './booking.types';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '../../common/utils/app-error';
import logger from '../../config/logger';

export class BookingService {
  private bookingRepository: BookingRepository;
  private vehicleRepository: VehicleRepository;
  private notificationService: NotificationService;

  constructor() {
    this.bookingRepository = new BookingRepository();
    this.vehicleRepository = new VehicleRepository();
    this.notificationService = new NotificationService();
  }

  /**
   * Creates a new booking entry after validating availability, conflicts, and self-booking blocks.
   */
  async createBooking(customerId: string, dto: CreateBookingDto): Promise<any> {
    logger.info(`BookingService: Customer ${customerId} attempting to book vehicle ${dto.vehicleId}`);

    // 1. Fetch vehicle listing and verify active/available status
    const vehicle = await this.vehicleRepository.findById(dto.vehicleId);
    if (!vehicle) {
      throw new NotFoundError('Vehicle not found.');
    }

    if (vehicle.status !== 'ACTIVE' || !vehicle.isAvailable) {
      throw new BadRequestError('This vehicle is currently not active or available for booking.');
    }

    // 2. Prevent owners booking their own vehicle listings
    if (vehicle.ownerId === customerId) {
      throw new BadRequestError('You cannot book your own vehicle listing.');
    }

    // 3. Prevent date range overlaps with active reservations
    const conflict = await this.bookingRepository.findConflictingBooking(
      dto.vehicleId,
      dto.startDate,
      dto.endDate
    );
    if (conflict) {
      throw new ConflictError('The vehicle is already booked for the selected date range.');
    }

    // 4. Calculate total days and amounts
    const msPerDay = 1000 * 60 * 60 * 24;
    const timeDiff = dto.endDate.getTime() - dto.startDate.getTime();
    const totalDays = Math.ceil(timeDiff / msPerDay);
    if (totalDays <= 0) {
      throw new BadRequestError('Booking duration must be at least 1 day.');
    }

    const totalAmount = totalDays * vehicle.pricePerDay;

    // 5. Commit record
    const booking = await this.bookingRepository.create(
      customerId,
      vehicle.ownerId,
      totalDays,
      totalAmount,
      dto
    );

    logger.info(`BookingService: Booking ${booking.id} created successfully`);

    // Trigger notification to the vehicle owner
    this.notificationService.createNotification(booking.ownerId, {
      title: 'New Booking Request',
      message: 'You received a new booking request.',
      type: 'BOOKING_REQUEST',
    }).catch((err) => logger.error('Failed to trigger BOOKING_REQUEST notification', err));

    return booking;
  }

  /**
   * Retrieves booking details if requested by customer, owner, or ADMIN.
   */
  async getBookingDetails(id: string, userId: string, userRole: string): Promise<any> {
    logger.info(`BookingService: Retrieving details of booking ${id} for user ${userId}`);

    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found.');
    }

    // Access authorization: Customer, Owner, or Admin
    if (
      booking.customerId !== userId &&
      booking.ownerId !== userId &&
      userRole !== Role.ADMIN
    ) {
      throw new ForbiddenError('You are not authorized to view this booking.');
    }

    return booking;
  }

  /**
   * Confirms a PENDING booking. Owner only.
   */
  async confirmBooking(id: string, ownerId: string, userRole: string): Promise<any> {
    logger.info(`BookingService: Confirm request for booking ${id} by owner ${ownerId}`);

    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found.');
    }

    // Owner authorization check
    if (booking.ownerId !== ownerId && userRole !== Role.ADMIN) {
      throw new ForbiddenError('Only the vehicle owner can confirm this booking.');
    }

    // Status transition check
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestError('Only pending bookings can be confirmed.');
    }

    const updatedBooking = await this.bookingRepository.updateStatus(id, BookingStatus.CONFIRMED);
    logger.info(`BookingService: Booking ${id} successfully confirmed`);

    // Trigger notification to the customer
    this.notificationService.createNotification(updatedBooking.customerId, {
      title: 'Booking Confirmed',
      message: 'Your booking has been confirmed.',
      type: 'BOOKING_CONFIRMED',
    }).catch((err) => logger.error('Failed to trigger BOOKING_CONFIRMED notification', err));

    return updatedBooking;
  }

  /**
   * Rejects a PENDING or CONFIRMED booking. Owner only.
   */
  async rejectBooking(id: string, ownerId: string, userRole: string): Promise<any> {
    logger.info(`BookingService: Reject request for booking ${id} by owner ${ownerId}`);

    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found.');
    }

    // Owner authorization check
    if (booking.ownerId !== ownerId && userRole !== Role.ADMIN) {
      throw new ForbiddenError('Only the vehicle owner can reject this booking.');
    }

    // Status transition check: allow rejecting PENDING or CONFIRMED bookings (which might be paid)
    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.CONFIRMED
    ) {
      throw new BadRequestError('Only pending or confirmed bookings can be rejected.');
    }

    const updatedBooking = await this.bookingRepository.updateStatus(id, BookingStatus.REJECTED);
    logger.info(`BookingService: Booking ${id} successfully rejected`);

    // Trigger notification to the customer
    this.notificationService.createNotification(updatedBooking.customerId, {
      title: 'Booking Rejected',
      message: 'Your booking request was rejected.',
      type: 'BOOKING_REJECTED',
    }).catch((err) => logger.error('Failed to trigger BOOKING_REJECTED notification', err));

    // Handle auto refund if there is a successful payment
    try {
      const prismaInstance = require('../../config/database').default;
      const successPayment = await prismaInstance.payment.findFirst({
        where: {
          bookingId: id,
          status: 'SUCCESS',
        },
      });

      if (successPayment) {
        logger.info(`BookingService: Found successful payment ${successPayment.id} for booking ${id}. Triggering refund.`);
        const { PaymentService } = require('../payments/payment.service');
        const paymentService = new PaymentService();
        await paymentService.refundPayment(successPayment.id, ownerId, userRole);
      }
    } catch (refundErr) {
      logger.error(`BookingService: Automatic refund failed for booking ${id}`, refundErr);
    }

    return updatedBooking;
  }

  /**
   * Cancels a PENDING or CONFIRMED booking. Customer only.
   */
  async cancelBooking(id: string, customerId: string, userRole: string): Promise<any> {
    logger.info(`BookingService: Cancel request for booking ${id} by customer ${customerId}`);

    const booking = await this.bookingRepository.findById(id);
    if (!booking) {
      throw new NotFoundError('Booking not found.');
    }

    // Customer authorization check
    if (booking.customerId !== customerId && userRole !== Role.ADMIN) {
      throw new ForbiddenError('Only the customer who created this booking can cancel it.');
    }

    // Status transition check: only PENDING or CONFIRMED bookings can be cancelled
    if (
      booking.status !== BookingStatus.PENDING &&
      booking.status !== BookingStatus.CONFIRMED
    ) {
      throw new BadRequestError('Only pending or confirmed bookings can be cancelled.');
    }

    const updatedBooking = await this.bookingRepository.updateStatus(id, BookingStatus.CANCELLED);
    logger.info(`BookingService: Booking ${id} successfully cancelled`);

    // Trigger notification to the vehicle owner
    this.notificationService.createNotification(updatedBooking.ownerId, {
      title: 'Booking Cancelled',
      message: 'A customer cancelled a booking.',
      type: 'BOOKING_CANCELLED',
    }).catch((err) => logger.error('Failed to trigger BOOKING_CANCELLED notification', err));

    // Handle auto refund if there is a successful payment
    try {
      const prismaInstance = require('../../config/database').default;
      const successPayment = await prismaInstance.payment.findFirst({
        where: {
          bookingId: id,
          status: 'SUCCESS',
        },
      });

      if (successPayment) {
        logger.info(`BookingService: Found successful payment ${successPayment.id} for booking ${id}. Triggering refund.`);
        const { PaymentService } = require('../payments/payment.service');
        const paymentService = new PaymentService();
        await paymentService.refundPayment(successPayment.id, customerId, userRole);
      }
    } catch (refundErr) {
      logger.error(`BookingService: Automatic refund failed for booking ${id}`, refundErr);
    }

    return updatedBooking;
  }

  /**
   * List bookings requested by the authenticated customer.
   */
  async listCustomerBookings(customerId: string, page: number, limit: number): Promise<any> {
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
  async listOwnerBookings(ownerId: string, page: number, limit: number): Promise<any> {
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

export default BookingService;
