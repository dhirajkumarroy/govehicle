import { Notification, NotificationType } from '@prisma/client';
import { NotificationRepository } from './notification.repository';
import { NotFoundError, ForbiddenError } from '../../common/utils/app-error';
import logger from '../../config/logger';

export class NotificationService {
  private notificationRepository: NotificationRepository;

  constructor() {
    this.notificationRepository = new NotificationRepository();
  }

  /**
   * Triggers creation of a notification.
   */
  async createNotification(
    userId: string,
    data: { title: string; message: string; type: NotificationType }
  ): Promise<Notification> {
    logger.info(`NotificationService: Creating notification [type: ${data.type}] for user ${userId}`);
    return this.notificationRepository.create(userId, data);
  }

  /**
   * Retrieves paginated notifications of the logged-in user.
   */
  async listNotifications(
    userId: string,
    page: number,
    limit: number
  ): Promise<{ pagination: any; notifications: Notification[] }> {
    logger.info(`NotificationService: Listing notifications for user ${userId}`);
    const { total, notifications } = await this.notificationRepository.listByUser(userId, page, limit);
    const totalPages = Math.ceil(total / limit);

    return {
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
      notifications,
    };
  }

  /**
   * Returns unread count object.
   */
  async getUnreadCount(userId: string): Promise<{ count: number }> {
    logger.info(`NotificationService: Fetching unread count for user ${userId}`);
    const count = await this.notificationRepository.getUnreadCount(userId);
    return { count };
  }

  /**
   * Marks a specific user notification as read.
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    logger.info(`NotificationService: Marking notification ${id} as read for user ${userId}`);

    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundError('Notification not found.');
    }

    // Authorization: Ensure the notification belongs to the authenticated user
    if (notification.userId !== userId) {
      logger.warn(`NotificationService: User ${userId} unauthorized to access notification ${id}`);
      throw new ForbiddenError('You are not authorized to access this notification.');
    }

    return this.notificationRepository.markAsRead(id);
  }

  /**
   * Marks all unread notifications of user as read.
   */
  async markAllAsRead(userId: string): Promise<any> {
    logger.info(`NotificationService: Marking all notifications as read for user ${userId}`);
    return this.notificationRepository.markAllAsRead(userId);
  }

  /**
   * Deletes a user notification.
   */
  async deleteNotification(id: string, userId: string): Promise<Notification> {
    logger.info(`NotificationService: Deleting notification ${id} for user ${userId}`);

    const notification = await this.notificationRepository.findById(id);
    if (!notification) {
      throw new NotFoundError('Notification not found.');
    }

    // Authorization: Ensure the notification belongs to the authenticated user
    if (notification.userId !== userId) {
      logger.warn(`NotificationService: User ${userId} unauthorized to delete notification ${id}`);
      throw new ForbiddenError('You are not authorized to delete this notification.');
    }

    return this.notificationRepository.delete(id);
  }
}

export default NotificationService;
