"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const admin_service_1 = require("./admin.service");
const admin_validation_1 = require("./admin.validation");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
class AdminController {
    adminService;
    constructor() {
        this.adminService = new admin_service_1.AdminService();
    }
    /**
     * GET /api/v1/admin/dashboard
     */
    getDashboardStats = async (_req, res, next) => {
        try {
            const stats = await this.adminService.getDashboardStats();
            res.status(200).json(api_response_dto_1.ResponseDto.success('Dashboard statistics retrieved successfully.', stats));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/users
     */
    listUsers = async (req, res, next) => {
        try {
            const query = admin_validation_1.userQuerySchema.parse(req.query);
            const result = await this.adminService.listUsers(query);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Users list retrieved successfully.', result));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/users/:id
     */
    getUserDetails = async (req, res, next) => {
        try {
            const { id } = admin_validation_1.uuidParamSchema.parse(req.params);
            const user = await this.adminService.getUserDetails(id);
            res.status(200).json(api_response_dto_1.ResponseDto.success('User details retrieved successfully.', user));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * PATCH /api/v1/admin/users/:id/block
     */
    blockUser = async (req, res, next) => {
        try {
            const { id } = admin_validation_1.uuidParamSchema.parse(req.params);
            const user = await this.adminService.blockUser(id);
            res.status(200).json(api_response_dto_1.ResponseDto.success('User has been blocked successfully.', user));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * PATCH /api/v1/admin/users/:id/unblock
     */
    unblockUser = async (req, res, next) => {
        try {
            const { id } = admin_validation_1.uuidParamSchema.parse(req.params);
            const user = await this.adminService.unblockUser(id);
            res.status(200).json(api_response_dto_1.ResponseDto.success('User has been unblocked successfully.', user));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/vehicles
     */
    listVehicles = async (req, res, next) => {
        try {
            const query = admin_validation_1.vehicleQuerySchema.parse(req.query);
            const result = await this.adminService.listVehicles(query);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Vehicles list retrieved successfully.', result));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/vehicles/:id
     */
    getVehicleDetails = async (req, res, next) => {
        try {
            const { id } = admin_validation_1.uuidParamSchema.parse(req.params);
            const vehicle = await this.adminService.getVehicleDetails(id);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Vehicle details retrieved successfully.', vehicle));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * PATCH /api/v1/admin/vehicles/:id/approve
     */
    approveVehicle = async (req, res, next) => {
        try {
            const { id } = admin_validation_1.uuidParamSchema.parse(req.params);
            const vehicle = await this.adminService.approveVehicle(id);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Vehicle has been approved successfully.', vehicle));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * PATCH /api/v1/admin/vehicles/:id/reject
     */
    rejectVehicle = async (req, res, next) => {
        try {
            const { id } = admin_validation_1.uuidParamSchema.parse(req.params);
            const vehicle = await this.adminService.rejectVehicle(id);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Vehicle has been rejected successfully.', vehicle));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * PATCH /api/v1/admin/vehicles/:id/suspend
     */
    suspendVehicle = async (req, res, next) => {
        try {
            const { id } = admin_validation_1.uuidParamSchema.parse(req.params);
            const vehicle = await this.adminService.suspendVehicle(id);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Vehicle has been suspended successfully.', vehicle));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/bookings
     */
    listBookings = async (req, res, next) => {
        try {
            const query = admin_validation_1.bookingQuerySchema.parse(req.query);
            const result = await this.adminService.listBookings(query);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Bookings list retrieved successfully.', result));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * GET /api/v1/admin/bookings/:id
     */
    getBookingDetails = async (req, res, next) => {
        try {
            const { id } = admin_validation_1.uuidParamSchema.parse(req.params);
            const booking = await this.adminService.getBookingDetails(id);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Booking details retrieved successfully.', booking));
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AdminController = AdminController;
exports.default = AdminController;
