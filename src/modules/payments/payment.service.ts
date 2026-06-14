import crypto from 'crypto';
import { Payment, PaymentStatus, BookingStatus } from '@prisma/client';
import { PaymentRepository } from './payment.repository';
import { BookingRepository } from '../bookings/booking.repository';
import { NotificationService } from '../notifications/notification.service';
import razorpay from '../../config/razorpay';
import { env } from '../../config/env';
import logger from '../../config/logger';
import {
  NotFoundError,
  BadRequestError,
  ForbiddenError,
  ConflictError,
} from '../../common/utils/app-error';
import { VerifyPaymentDto } from './payment.types';

export class PaymentService {
  private paymentRepository: PaymentRepository;
  private bookingRepository: BookingRepository;
  private notificationService: NotificationService;

  constructor() {
    this.paymentRepository = new PaymentRepository();
    this.bookingRepository = new BookingRepository();
    this.notificationService = new NotificationService();
  }

  /**
   * Generates a new Razorpay order for a pending booking and stores a pending Payment.
   */
  async createOrder(customerId: string, bookingId: string): Promise<{ payment: Payment; razorpayOrder: any }> {
    logger.info(`PaymentService: Creating payment order for booking ${bookingId} requested by customer ${customerId}`);

    // 1. Fetch and validate booking
    const booking = await this.bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found.');
    }

    // 2. Access check
    if (booking.customerId !== customerId) {
      throw new ForbiddenError('You are not authorized to make a payment for this booking.');
    }

    // 3. Status checks
    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestError('Payments can only be created for pending bookings.');
    }

    // 4. Duplicate successful payment prevention
    const existingSuccessPayment = await this.paymentRepository.findSuccessPaymentByBookingId(bookingId);
    if (existingSuccessPayment) {
      throw new ConflictError('This booking has already been paid for successfully.');
    }

    // 5. Razorpay expects amount in paise (minor currency unit)
    const amountInPaise = Math.round(booking.totalAmount * 100);

    // 6. Invoke Razorpay API
    let razorpayOrder;
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: booking.id,
        notes: {
          bookingId: booking.id,
          customerId: booking.customerId,
        },
      });
    } catch (err: any) {
      logger.error('Razorpay order creation failed:', err);
      throw new BadRequestError(`Razorpay service error: ${err.message || err}`);
    }

    // 7. Persist payment tracker in PENDING status
    const payment = await this.paymentRepository.createPayment({
      bookingId: booking.id,
      userId: customerId,
      amount: booking.totalAmount,
      providerOrderId: razorpayOrder.id,
    });

    logger.info(`PaymentService: Order created successfully. Razorpay Order ID: ${razorpayOrder.id}`);

    return {
      payment,
      razorpayOrder,
    };
  }

  /**
   * Verifies signature of client payment callback, marks payment SUCCESS and confirms booking.
   */
  async verifyPayment(customerId: string, dto: VerifyPaymentDto): Promise<{ payment: Payment; booking: any }> {
    logger.info(`PaymentService: Verifying signature for Razorpay Order ${dto.razorpayOrderId}`);

    // 1. Fetch payment record
    const payment = await this.paymentRepository.findByOrderId(dto.razorpayOrderId);
    if (!payment) {
      throw new NotFoundError('Payment record not found for the provided Order ID.');
    }

    // 2. Verify ownership
    if (payment.userId !== customerId) {
      throw new ForbiddenError('You are not authorized to verify this payment.');
    }

    // 3. Prevent duplicate updates if already successful
    if (payment.status === PaymentStatus.SUCCESS) {
      const booking = await this.bookingRepository.findById(payment.bookingId);
      return { payment, booking };
    }

    // 4. Verify signature cryptographically
    const text = `${dto.razorpayOrderId}|${dto.razorpayPaymentId}`;
    const generatedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(text)
      .digest('hex');

    if (generatedSignature !== dto.razorpaySignature) {
      logger.warn(`PaymentService: Invalid signature for Order ${dto.razorpayOrderId}`);
      throw new BadRequestError('Invalid payment signature verification.');
    }

    // 5. Update Payment Status to SUCCESS
    const updatedPayment = await this.paymentRepository.updatePaymentStatusByOrderId(
      dto.razorpayOrderId,
      PaymentStatus.SUCCESS,
      {
        providerPaymentId: dto.razorpayPaymentId,
        providerSignature: dto.razorpaySignature,
        paidAt: new Date(),
      }
    );

    // 6. Update Booking Status to CONFIRMED
    const updatedBooking = await this.bookingRepository.updateStatus(payment.bookingId, BookingStatus.CONFIRMED);

    logger.info(`PaymentService: Payment verified successfully for booking ${payment.bookingId}. Status: SUCCESS`);

    // 7. Dispatch booking notifications
    this.notificationService.createNotification(updatedBooking.customerId, {
      title: 'Booking Confirmed',
      message: 'Your booking has been confirmed.',
      type: 'BOOKING_CONFIRMED',
    }).catch((err) => logger.error('Failed to trigger BOOKING_CONFIRMED notification', err));

    return {
      payment: updatedPayment,
      booking: updatedBooking,
    };
  }

  /**
   * Processes verified Webhook callbacks from Razorpay.
   */
  async processWebhook(headers: any, rawBody: Buffer): Promise<{ processed: boolean }> {
    // 1. Webhook Signature Verification
    const signature = headers['x-razorpay-signature'];
    if (!signature) {
      throw new BadRequestError('Missing x-razorpay-signature header.');
    }

    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_WEBHOOK_SECRET)
      .update(rawBody)
      .digest('hex');

    if (expectedSignature !== signature) {
      logger.warn('PaymentService Webhook: Invalid webhook signature verification.');
      throw new BadRequestError('Invalid webhook signature verification.');
    }

    const eventData = JSON.parse(rawBody.toString('utf-8'));
    logger.info(`PaymentService Webhook: Received verified webhook event: ${eventData.event}`);

    const payload = eventData.payload;

    switch (eventData.event) {
      case 'order.paid': {
        const orderEntity = payload.order?.entity;
        if (!orderEntity) break;

        const orderId = orderEntity.id;
        const paymentEntity = payload.payment?.entity;
        const paymentId = paymentEntity?.id;

        const payment = await this.paymentRepository.findByOrderId(orderId);
        if (payment && payment.status === PaymentStatus.PENDING) {
          logger.info(`PaymentService Webhook: Processing order.paid for order ${orderId}`);
          
          await this.paymentRepository.updatePaymentStatusByOrderId(
            orderId,
            PaymentStatus.SUCCESS,
            {
              providerPaymentId: paymentId,
              paidAt: new Date(),
            }
          );

          const updatedBooking = await this.bookingRepository.updateStatus(payment.bookingId, BookingStatus.CONFIRMED);
          this.notificationService.createNotification(updatedBooking.customerId, {
            title: 'Booking Confirmed',
            message: 'Your booking has been confirmed.',
            type: 'BOOKING_CONFIRMED',
          }).catch((err) => logger.error('Failed to trigger BOOKING_CONFIRMED notification', err));
        }
        break;
      }

      case 'payment.failed': {
        const paymentEntity = payload.payment?.entity;
        if (!paymentEntity) break;

        const orderId = paymentEntity.order_id;
        const paymentId = paymentEntity.id;

        const payment = await this.paymentRepository.findByOrderId(orderId);
        if (payment && payment.status === PaymentStatus.PENDING) {
          logger.info(`PaymentService Webhook: Processing payment.failed for order ${orderId}`);
          await this.paymentRepository.updatePaymentStatusByOrderId(
            orderId,
            PaymentStatus.FAILED,
            {
              providerPaymentId: paymentId,
            }
          );
        }
        break;
      }

      case 'refund.processed': {
        const refundEntity = payload.refund?.entity;
        if (!refundEntity) break;

        const paymentId = refundEntity.payment_id;
        logger.info(`PaymentService Webhook: Processing refund.processed for payment ID: ${paymentId}`);

        // Find the payment record by its providerPaymentId
        // Let's query using custom finder or db query since we didn't add findByPaymentId
        // Wait, we can add a method or use prisma directly. Let's write code safely.
        // We'll update status using prisma client indirectly, or via a search.
        // Let's update status. Since we have the paymentId (pay_xxx), we can update payments where providerPaymentId = paymentId.
        const prismaInstance = require('../../config/database').default;
        await prismaInstance.payment.updateMany({
          where: { providerPaymentId: paymentId, status: { not: PaymentStatus.REFUNDED } },
          data: {
            status: PaymentStatus.REFUNDED,
            refundedAt: new Date(),
          },
        });
        break;
      }

      default:
        logger.info(`PaymentService Webhook: Unhandled webhook event type: ${eventData.event}`);
    }

    return { processed: true };
  }

  /**
   * Refounds an existing successful payment via Razorpay.
   */
  async refundPayment(paymentId: string, requesterId: string, userRole: string): Promise<Payment> {
    logger.info(`PaymentService: Initiating refund for payment UUID ${paymentId} requested by user ${requesterId}`);

    // 1. Fetch payment record
    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment record not found.');
    }

    // 2. Check if already refunded
    if (payment.status === PaymentStatus.REFUNDED) {
      return payment;
    }

    // 3. Must be SUCCESS to be eligible for refund
    if (payment.status !== PaymentStatus.SUCCESS) {
      throw new BadRequestError('Only successful payments can be refunded.');
    }

    // 4. Fetch booking and authorize
    const booking = await this.bookingRepository.findById(payment.bookingId);
    if (!booking) {
      throw new NotFoundError('Associated booking not found.');
    }

    if (
      booking.customerId !== requesterId &&
      booking.ownerId !== requesterId &&
      userRole !== 'ADMIN'
    ) {
      throw new ForbiddenError('You are not authorized to refund this payment.');
    }

    // 5. Build idempotency key to prevent double refunds
    const idempotencyKey = `refund_${booking.id}_${payment.id}`;
    const amountInPaise = Math.round(payment.amount * 100);

    if (!payment.providerPaymentId) {
      throw new BadRequestError('Payment is missing a provider payment ID, cannot request refund.');
    }

    // 6. Invoke Razorpay API
    try {
      await (razorpay.payments.refund as any)(payment.providerPaymentId, {
        amount: amountInPaise,
        notes: {
          bookingId: booking.id,
          reason: 'Cancellation or Rejection refund',
        },
      }, {
        'x-idempotency-key': idempotencyKey,
      });
    } catch (err: any) {
      logger.error('Razorpay refund API call failed:', err);
      throw new BadRequestError(`Razorpay refund failed: ${err.message || err}`);
    }

    // 7. Update status to REFUNDED
    const updatedPayment = await this.paymentRepository.updatePaymentStatusById(
      payment.id,
      PaymentStatus.REFUNDED,
      {
        refundedAt: new Date(),
      }
    );

    logger.info(`PaymentService: Payment ${payment.id} successfully refunded on Razorpay.`);

    return updatedPayment;
  }

  /**
   * Retrieves single payment details with authorization.
   */
  async getPaymentDetails(paymentId: string, userId: string, userRole: string): Promise<Payment> {
    logger.info(`PaymentService: Retrieving payment details for ${paymentId} requested by user ${userId}`);

    const payment = await this.paymentRepository.findById(paymentId);
    if (!payment) {
      throw new NotFoundError('Payment record not found.');
    }

    const booking = await this.bookingRepository.findById(payment.bookingId);
    if (
      payment.userId !== userId &&
      booking?.ownerId !== userId &&
      userRole !== 'ADMIN'
    ) {
      throw new ForbiddenError('You are not authorized to view this payment.');
    }

    return payment;
  }

  /**
   * Lists paginated payments for customer.
   */
  async listMyPayments(userId: string, page: number, limit: number): Promise<any> {
    const { total, payments } = await this.paymentRepository.listByUserId(userId, page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      payments,
    };
  }
}

export default PaymentService;
