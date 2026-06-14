import { Payment, PaymentStatus } from '@prisma/client';
import prisma from '../../config/database';

export class PaymentRepository {
  /**
   * Creates a new pending payment order tracking record.
   */
  async createPayment(data: {
    bookingId: string;
    userId: string;
    amount: number;
    providerOrderId: string;
  }): Promise<Payment> {
    return prisma.payment.create({
      data: {
        bookingId: data.bookingId,
        userId: data.userId,
        amount: data.amount,
        providerOrderId: data.providerOrderId,
        status: PaymentStatus.PENDING,
      },
    });
  }

  /**
   * Finds payment record by Razorpay Order ID.
   */
  async findByOrderId(providerOrderId: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { providerOrderId },
    });
  }

  /**
   * Finds payment record by database UUID.
   */
  async findById(id: string): Promise<Payment | null> {
    return prisma.payment.findUnique({
      where: { id },
    });
  }

  /**
   * Finds any successful payment record for a booking.
   */
  async findSuccessPaymentByBookingId(bookingId: string): Promise<Payment | null> {
    return prisma.payment.findFirst({
      where: {
        bookingId,
        status: PaymentStatus.SUCCESS,
      },
    });
  }

  /**
   * Updates status and metadata on a payment record using its Razorpay Order ID.
   */
  async updatePaymentStatusByOrderId(
    providerOrderId: string,
    status: PaymentStatus,
    metadata?: {
      providerPaymentId?: string;
      providerSignature?: string;
      paidAt?: Date;
      refundedAt?: Date;
    }
  ): Promise<Payment> {
    return prisma.payment.update({
      where: { providerOrderId },
      data: {
        status,
        providerPaymentId: metadata?.providerPaymentId,
        providerSignature: metadata?.providerSignature,
        paidAt: metadata?.paidAt,
        refundedAt: metadata?.refundedAt,
      },
    });
  }

  /**
   * Updates status and metadata on a payment record using its database UUID.
   */
  async updatePaymentStatusById(
    id: string,
    status: PaymentStatus,
    metadata?: {
      providerPaymentId?: string;
      providerSignature?: string;
      paidAt?: Date;
      refundedAt?: Date;
    }
  ): Promise<Payment> {
    return prisma.payment.update({
      where: { id },
      data: {
        status,
        providerPaymentId: metadata?.providerPaymentId,
        providerSignature: metadata?.providerSignature,
        paidAt: metadata?.paidAt,
        refundedAt: metadata?.refundedAt,
      },
    });
  }

  /**
   * Lists paginated payments for a specific user.
   */
  async listByUserId(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ total: number; payments: Payment[] }> {
    const where = { userId };
    const [total, payments] = await prisma.$transaction([
      prisma.payment.count({ where }),
      prisma.payment.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
        include: {
          booking: {
            include: {
              vehicle: true
            }
          }
        }
      })
    ]);
    return { total, payments };
  }
}

export default PaymentRepository;
