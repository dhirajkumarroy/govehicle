"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleController = void 0;
const vehicle_service_1 = require("./vehicle.service");
const vehicle_validation_1 = require("./vehicle.validation");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
const app_error_1 = require("../../common/utils/app-error");
const logger_1 = __importDefault(require("../../config/logger"));
class VehicleController {
    vehicleService;
    constructor() {
        this.vehicleService = new vehicle_service_1.VehicleService();
    }
    /**
     * Registers a new vehicle with image uploads.
     * POST /api/v1/vehicles
     */
    createVehicle = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            if (!userId || !userRole) {
                logger_1.default.warn('VehicleController: Create vehicle failed due to missing req.user credentials');
                throw new app_error_1.UnauthorizedError('Unauthorized access.');
            }
            // Parse and validate req.body fields with Zod
            const validatedBody = vehicle_validation_1.createVehicleSchema.parse(req.body);
            // Extract uploaded files from Multer array
            const files = req.files;
            if (!files || files.length === 0) {
                throw new app_error_1.BadRequestError('At least 1 vehicle image is required.');
            }
            const vehicle = await this.vehicleService.createVehicle(userId, userRole, validatedBody, files);
            res.status(201).json(api_response_dto_1.ResponseDto.success('Vehicle registered successfully.', vehicle));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Search and list catalog vehicles.
     * GET /api/v1/vehicles
     */
    listVehicles = async (req, res, next) => {
        try {
            // Validate queries via Zod
            const validatedQuery = vehicle_validation_1.vehicleQuerySchema.parse(req.query);
            const result = await this.vehicleService.listVehicles(validatedQuery);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Vehicles retrieved successfully.', result));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Retrieve vehicle detail schema by UUID.
     * GET /api/v1/vehicles/:id
     */
    getVehicleDetails = async (req, res, next) => {
        try {
            const { id } = req.params;
            if (!id) {
                throw new app_error_1.BadRequestError('Vehicle ID is required.');
            }
            const vehicle = await this.vehicleService.getVehicleDetails(id);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Vehicle details retrieved successfully.', vehicle));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Update properties on an existing vehicle listing.
     * PATCH /api/v1/vehicles/:id
     */
    updateVehicle = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            if (!userId || !userRole) {
                logger_1.default.warn('VehicleController: Update vehicle failed due to missing req.user credentials');
                throw new app_error_1.UnauthorizedError('Unauthorized access.');
            }
            const { id } = req.params;
            if (!id) {
                throw new app_error_1.BadRequestError('Vehicle ID is required.');
            }
            // Parse partial properties validation
            const validatedBody = vehicle_validation_1.updateVehicleSchema.parse(req.body);
            const vehicle = await this.vehicleService.updateVehicle(id, userId, userRole, validatedBody);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Vehicle updated successfully.', vehicle));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Soft deletes a vehicle by setting state to SUSPENDED.
     * DELETE /api/v1/vehicles/:id
     */
    deleteVehicle = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const userRole = req.user?.role;
            if (!userId || !userRole) {
                logger_1.default.warn('VehicleController: Delete vehicle failed due to missing req.user credentials');
                throw new app_error_1.UnauthorizedError('Unauthorized access.');
            }
            const { id } = req.params;
            if (!id) {
                throw new app_error_1.BadRequestError('Vehicle ID is required.');
            }
            await this.vehicleService.deleteVehicle(id, userId, userRole);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Vehicle deleted successfully.'));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * Retrieve vehicles owned by the authenticated owner.
     * GET /api/v1/vehicles/my
     */
    listMyVehicles = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                logger_1.default.warn('VehicleController: List owner vehicles failed due to missing req.user credentials');
                throw new app_error_1.UnauthorizedError('Unauthorized access.');
            }
            const page = Math.max(1, parseInt(req.query.page || '1', 10));
            const limit = Math.max(1, parseInt(req.query.limit || '10', 10));
            const result = await this.vehicleService.listMyVehicles(userId, page, limit);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Owner vehicles retrieved successfully.', result));
        }
        catch (error) {
            next(error);
        }
    };
}
exports.VehicleController = VehicleController;
exports.default = VehicleController;
