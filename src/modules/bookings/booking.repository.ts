import { Booking, BookingStatus } from '@prisma/client';
import prisma from '../../config/database';
import { CreateBookingDto } from './booking.types';

export class BookingRepository {
  /**
   * Inserts a new booking record.
   */
  async create(
    customerId: string,
    ownerId: string,
    totalDays: number,
    totalAmount: number,
    dto: CreateBookingDto
  ): Promise<any> {
    return prisma.booking.create({
      data: {
        vehicleId: dto.vehicleId,
        customerId,
        ownerId,
        startDate: dto.startDate,
        endDate: dto.endDate,
        totalDays,
        totalAmount,
        status: BookingStatus.PENDING,
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
  async findById(id: string): Promise<any> {
    return prisma.booking.findUnique({
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
  async findConflictingBooking(
    vehicleId: string,
    startDate: Date,
    endDate: Date
  ): Promise<Booking | null> {
    return prisma.booking.findFirst({
      where: {
        vehicleId,
        status: { in: [BookingStatus.PENDING, BookingStatus.CONFIRMED] },
        startDate: { lte: endDate },
        endDate: { gte: startDate },
      },
    });
  }

  /**
   * Lists paginated bookings requested by a specific customer.
   */
  async listByCustomer(
    customerId: string,
    page: number,
    limit: number
  ): Promise<{ total: number; bookings: any[] }> {
    const where = { customerId };

    const [total, bookings] = await prisma.$transaction([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
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
  async listByOwner(
    ownerId: string,
    page: number,
    limit: number
  ): Promise<{ total: number; bookings: any[] }> {
    const where = { ownerId };

    const [total, bookings] = await prisma.$transaction([
      prisma.booking.count({ where }),
      prisma.booking.findMany({
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
  async updateStatus(id: string, status: BookingStatus): Promise<any> {
    return prisma.booking.update({
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

export default BookingRepository;
