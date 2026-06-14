"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminService = void 0;
const client_1 = require("@prisma/client");
const admin_repository_1 = require("./admin.repository");
const notification_service_1 = require("../notifications/notification.service");
const app_error_1 = require("../../common/utils/app-error");
const logger_1 = __importDefault(require("../../config/logger"));
class AdminService {
    adminRepository;
    notificationService;
    constructor() {
        this.adminRepository = new admin_repository_1.AdminRepository();
        this.notificationService = new notification_service_1.NotificationService();
    }
    /**
     * Retrieves dashboard statistics.
     */
    async getDashboardStats() {
        logger_1.default.info('AdminService: Fetching dashboard stats');
        return this.adminRepository.getDashboardStats();
    }
    /**
     * Retrieves users list.
     */
    async listUsers(dto) {
        logger_1.default.info(`AdminService: Listing users (page: ${dto.page}, limit: ${dto.limit})`);
        const { total, users } = await this.adminRepository.listUsers(dto);
        const totalPages = Math.ceil(total / dto.limit);
        return {
            pagination: {
                total,
                page: dto.page,
                limit: dto.limit,
                totalPages,
            },
            users,
        };
    }
    /**
     * Retrieves user details.
     */
    async getUserDetails(id) {
        logger_1.default.info(`AdminService: Fetching user details for ID: ${id}`);
        const user = await this.adminRepository.getUserById(id);
        if (!user) {
            throw new app_error_1.NotFoundError('User not found.');
        }
        return user;
    }
    /**
     * Blocks a user and triggers a notification.
     */
    async blockUser(id) {
        logger_1.default.info(`AdminService: Blocking user ID: ${id}`);
        const userExists = await this.adminRepository.getUserById(id);
        if (!userExists) {
            throw new app_error_1.NotFoundError('User not found.');
        }
        const updatedUser = await this.adminRepository.updateUserBlockStatus(id, true);
        // Send SYSTEM notification to the blocked user
        this.notificationService.createNotification(id, {
            title: 'Account Blocked',
            message: 'Your account has been blocked by an administrator.',
            type: 'SYSTEM',
        }).catch((err) => logger_1.default.error(`Failed to trigger block notification for user ${id}`, err));
        return updatedUser;
    }
    /**
     * Unblocks a user.
     */
    async unblockUser(id) {
        logger_1.default.info(`AdminService: Unblocking user ID: ${id}`);
        const userExists = await this.adminRepository.getUserById(id);
        if (!userExists) {
            throw new app_error_1.NotFoundError('User not found.');
        }
        return this.adminRepository.updateUserBlockStatus(id, false);
    }
    /**
     * Retrieves vehicles list.
     */
    async listVehicles(dto) {
        logger_1.default.info(`AdminService: Listing vehicles (page: ${dto.page}, limit: ${dto.limit})`);
        const { total, vehicles } = await this.adminRepository.listVehicles(dto);
        const totalPages = Math.ceil(total / dto.limit);
        return {
            pagination: {
                total,
                page: dto.page,
                limit: dto.limit,
                totalPages,
            },
            vehicles,
        };
    }
    /**
     * Retrieves vehicle details.
     */
    async getVehicleDetails(id) {
        logger_1.default.info(`AdminService: Fetching vehicle details for ID: ${id}`);
        const vehicle = await this.adminRepository.getVehicleById(id);
        if (!vehicle) {
            throw new app_error_1.NotFoundError('Vehicle not found.');
        }
        return vehicle;
    }
    /**
     * Approves a vehicle and triggers a notification.
     */
    async approveVehicle(id) {
        logger_1.default.info(`AdminService: Approving vehicle ID: ${id}`);
        const vehicle = await this.adminRepository.getVehicleById(id);
        if (!vehicle) {
            throw new app_error_1.NotFoundError('Vehicle not found.');
        }
        const updatedVehicle = await this.adminRepository.updateVehicleStatus(id, client_1.VehicleStatus.ACTIVE);
        // Send SYSTEM notification to the vehicle owner
        this.notificationService.createNotification(vehicle.ownerId, {
            title: 'Vehicle Approved',
            message: `Your vehicle listing "${vehicle.title}" has been approved.`,
            type: 'SYSTEM',
        }).catch((err) => logger_1.default.error(`Failed to trigger approve notification for vehicle ${id}`, err));
        return updatedVehicle;
    }
    /**
     * Rejects a vehicle and triggers a notification.
     */
    async rejectVehicle(id) {
        logger_1.default.info(`AdminService: Rejecting vehicle ID: ${id}`);
        const vehicle = await this.adminRepository.getVehicleById(id);
        if (!vehicle) {
            throw new app_error_1.NotFoundError('Vehicle not found.');
        }
        const updatedVehicle = await this.adminRepository.updateVehicleStatus(id, client_1.VehicleStatus.REJECTED);
        // Send SYSTEM notification to the vehicle owner
        this.notificationService.createNotification(vehicle.ownerId, {
            title: 'Vehicle Rejected',
            message: `Your vehicle listing "${vehicle.title}" has been rejected.`,
            type: 'SYSTEM',
        }).catch((err) => logger_1.default.error(`Failed to trigger reject notification for vehicle ${id}`, err));
        return updatedVehicle;
    }
    /**
     * Suspends a vehicle.
     */
    async suspendVehicle(id) {
        logger_1.default.info(`AdminService: Suspending vehicle ID: ${id}`);
        const vehicle = await this.adminRepository.getVehicleById(id);
        if (!vehicle) {
            throw new app_error_1.NotFoundError('Vehicle not found.');
        }
        return this.adminRepository.updateVehicleStatus(id, client_1.VehicleStatus.SUSPENDED);
    }
    /**
     * Retrieves bookings list.
     */
    async listBookings(dto) {
        logger_1.default.info(`AdminService: Listing bookings (page: ${dto.page}, limit: ${dto.limit})`);
        const { total, bookings } = await this.adminRepository.listBookings(dto);
        const totalPages = Math.ceil(total / dto.limit);
        return {
            pagination: {
                total,
                page: dto.page,
                limit: dto.limit,
                totalPages,
            },
            bookings,
        };
    }
    /**
     * Retrieves booking details.
     */
    async getBookingDetails(id) {
        logger_1.default.info(`AdminService: Fetching booking details for ID: ${id}`);
        const booking = await this.adminRepository.getBookingById(id);
        if (!booking) {
            throw new app_error_1.NotFoundError('Booking not found.');
        }
        return booking;
    }
}
exports.AdminService = AdminService;
exports.default = AdminService;
