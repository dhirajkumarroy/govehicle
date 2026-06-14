"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const notification_repository_1 = require("./notification.repository");
const notification_queue_1 = require("../../queues/notification.queue");
const app_error_1 = require("../../common/utils/app-error");
const logger_1 = __importDefault(require("../../config/logger"));
class NotificationService {
    notificationRepository;
    constructor() {
        this.notificationRepository = new notification_repository_1.NotificationRepository();
    }
    /**
     * Triggers creation of a notification by adding it to a background queue.
     */
    async createNotification(userId, data) {
        logger_1.default.info(`NotificationService: Queueing notification [type: ${data.type}] for user ${userId}`);
        return notification_queue_1.notificationQueue.add('create_notification', { userId, data });
    }
    /**
     * Actual direct creation of notification in database (called by background worker).
     */
    async createNotificationDirect(userId, data) {
        logger_1.default.info(`NotificationService: Creating notification in database for user ${userId}`);
        return this.notificationRepository.create(userId, data);
    }
    /**
     * Retrieves paginated notifications of the logged-in user.
     */
    async listNotifications(userId, page, limit) {
        logger_1.default.info(`NotificationService: Listing notifications for user ${userId}`);
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
    async getUnreadCount(userId) {
        logger_1.default.info(`NotificationService: Fetching unread count for user ${userId}`);
        const count = await this.notificationRepository.getUnreadCount(userId);
        return { count };
    }
    /**
     * Marks a specific user notification as read.
     */
    async markAsRead(id, userId) {
        logger_1.default.info(`NotificationService: Marking notification ${id} as read for user ${userId}`);
        const notification = await this.notificationRepository.findById(id);
        if (!notification) {
            throw new app_error_1.NotFoundError('Notification not found.');
        }
        // Authorization: Ensure the notification belongs to the authenticated user
        if (notification.userId !== userId) {
            logger_1.default.warn(`NotificationService: User ${userId} unauthorized to access notification ${id}`);
            throw new app_error_1.ForbiddenError('You are not authorized to access this notification.');
        }
        return this.notificationRepository.markAsRead(id);
    }
    /**
     * Marks all unread notifications of user as read.
     */
    async markAllAsRead(userId) {
        logger_1.default.info(`NotificationService: Marking all notifications as read for user ${userId}`);
        return this.notificationRepository.markAllAsRead(userId);
    }
    /**
     * Deletes a user notification.
     */
    async deleteNotification(id, userId) {
        logger_1.default.info(`NotificationService: Deleting notification ${id} for user ${userId}`);
        const notification = await this.notificationRepository.findById(id);
        if (!notification) {
            throw new app_error_1.NotFoundError('Notification not found.');
        }
        // Authorization: Ensure the notification belongs to the authenticated user
        if (notification.userId !== userId) {
            logger_1.default.warn(`NotificationService: User ${userId} unauthorized to delete notification ${id}`);
            throw new app_error_1.ForbiddenError('You are not authorized to delete this notification.');
        }
        return this.notificationRepository.delete(id);
    }
}
exports.NotificationService = NotificationService;
exports.default = NotificationService;
