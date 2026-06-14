"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationController = void 0;
const notification_service_1 = require("./notification.service");
const notification_validation_1 = require("./notification.validation");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
const app_error_1 = require("../../common/utils/app-error");
class NotificationController {
    notificationService;
    constructor() {
        this.notificationService = new notification_service_1.NotificationService();
    }
    /**
     * List paginated notifications of the logged-in user.
     * GET /api/v1/notifications
     */
    listNotifications = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new app_error_1.UnauthorizedError('Unauthorized access.');
            }
            const query = notification_validation_1.notificationQuerySchema.parse(req.query);
            const result = await this.notificationService.listNotifications(userId, query.page, query.limit);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Notifications retrieved successfully.', result));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Get unread notifications count.
     * GET /api/v1/notifications/unread-count
     */
    getUnreadCount = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new app_error_1.UnauthorizedError('Unauthorized access.');
            }
            const result = await this.notificationService.getUnreadCount(userId);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Unread notification count retrieved successfully.', result));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Mark a single notification as read.
     * PATCH /api/v1/notifications/:id/read
     */
    markAsRead = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new app_error_1.UnauthorizedError('Unauthorized access.');
            }
            const { id } = notification_validation_1.uuidParamSchema.parse(req.params);
            const notification = await this.notificationService.markAsRead(id, userId);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Notification marked as read successfully.', notification));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Mark all notifications of a user as read.
     * PATCH /api/v1/notifications/read-all
     */
    markAllAsRead = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new app_error_1.UnauthorizedError('Unauthorized access.');
            }
            await this.notificationService.markAllAsRead(userId);
            res.status(200).json(api_response_dto_1.ResponseDto.success('All notifications marked as read successfully.'));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Delete a notification.
     * DELETE /api/v1/notifications/:id
     */
    deleteNotification = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                throw new app_error_1.UnauthorizedError('Unauthorized access.');
            }
            const { id } = notification_validation_1.uuidParamSchema.parse(req.params);
            await this.notificationService.deleteNotification(id, userId);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Notification deleted successfully.'));
        }
        catch (error) {
            next(error);
        }
    };
}
exports.NotificationController = NotificationController;
exports.default = NotificationController;
