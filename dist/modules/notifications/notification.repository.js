"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationRepository = void 0;
const database_1 = __importDefault(require("../../config/database"));
class NotificationRepository {
    /**
     * Creates a new notification record.
     */
    async create(userId, data) {
        return database_1.default.notification.create({
            data: {
                userId,
                title: data.title,
                message: data.message,
                type: data.type,
                isRead: false,
            },
        });
    }
    /**
     * Find notification by UUID.
     */
    async findById(id) {
        return database_1.default.notification.findUnique({
            where: { id },
        });
    }
    /**
     * Lists paginated notifications of a user, sorted newest first.
     */
    async listByUser(userId, page, limit) {
        const where = { userId };
        const [total, notifications] = await database_1.default.$transaction([
            database_1.default.notification.count({ where }),
            database_1.default.notification.findMany({
                where,
                orderBy: {
                    createdAt: 'desc',
                },
                skip: (page - 1) * limit,
                take: limit,
            }),
        ]);
        return { total, notifications };
    }
    /**
     * Returns count of unread notifications for a user.
     */
    async getUnreadCount(userId) {
        return database_1.default.notification.count({
            where: {
                userId,
                isRead: false,
            },
        });
    }
    /**
     * Marks a single notification as read.
     */
    async markAsRead(id) {
        return database_1.default.notification.update({
            where: { id },
            data: { isRead: true },
        });
    }
    /**
     * Marks all unread notifications of a user as read.
     */
    async markAllAsRead(userId) {
        return database_1.default.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: { isRead: true },
        });
    }
    /**
     * Deletes a notification by UUID.
     */
    async delete(id) {
        return database_1.default.notification.delete({
            where: { id },
        });
    }
}
exports.NotificationRepository = NotificationRepository;
exports.default = NotificationRepository;
