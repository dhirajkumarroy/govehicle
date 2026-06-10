"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.VehicleService = void 0;
const path_1 = __importDefault(require("path"));
const client_1 = require("@prisma/client");
const vehicle_repository_1 = require("./vehicle.repository");
const app_error_1 = require("../../common/utils/app-error");
const storage_service_1 = require("../uploads/storage.service");
const logger_1 = __importDefault(require("../../config/logger"));
class VehicleService {
    vehicleRepository;
    constructor() {
        this.vehicleRepository = new vehicle_repository_1.VehicleRepository();
    }
    /**
     * Registers a new vehicle with associated images uploaded to the storage service.
     */
    async createVehicle(ownerId, userRole, dto, files) {
        logger_1.default.info(`VehicleService: User ${ownerId} attempting to register a vehicle`);
        // 1. Authorize role: only OWNER and ADMIN can list vehicles
        if (userRole !== client_1.Role.OWNER && userRole !== client_1.Role.ADMIN) {
            logger_1.default.warn(`VehicleService: Unauthorized role ${userRole} for creating vehicle`);
            throw new app_error_1.ForbiddenError('Only users with the OWNER role or administrators can register vehicles.');
        }
        // 2. Validate registration number uniqueness
        const normalizedRegNum = dto.vehicleNumber.toUpperCase().trim();
        const existingVehicle = await this.vehicleRepository.findByVehicleNumber(normalizedRegNum);
        if (existingVehicle) {
            logger_1.default.warn(`VehicleService: Duplicate vehicle number registration attempt: ${normalizedRegNum}`);
            throw new app_error_1.ConflictError('A vehicle with this registration number is already registered.');
        }
        // 3. Enforce image limit bounds (1 - 10 images)
        if (!files || files.length === 0) {
            throw new app_error_1.BadRequestError('At least 1 vehicle image is required.');
        }
        if (files.length > 10) {
            throw new app_error_1.BadRequestError('A maximum of 10 vehicle images is allowed.');
        }
        // 4. Upload images via the StorageService abstraction
        const uploadedImages = [];
        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            const ext = path_1.default.extname(file.originalname) || '.jpg';
            const fileName = `vehicle-${ownerId}-${Date.now()}-${i}${ext}`;
            logger_1.default.info(`VehicleService: Uploading image ${i + 1}/${files.length} for ${normalizedRegNum}`);
            const imageUrl = await storage_service_1.storageService.uploadFile(file.buffer, fileName, 'vehicles', file.mimetype);
            uploadedImages.push({
                imageUrl,
                isPrimary: i === 0, // Make the first uploaded image the primary thumbnail
            });
        }
        // 5. Commit records in database transaction
        const vehicle = await this.vehicleRepository.create(ownerId, dto, uploadedImages);
        logger_1.default.info(`VehicleService: Vehicle ${vehicle.id} successfully created for owner ${ownerId}`);
        return vehicle;
    }
    /**
     * Returns a paginated, filtered catalog of active vehicles.
     */
    async listVehicles(query) {
        const { total, vehicles } = await this.vehicleRepository.list(query);
        const totalPages = Math.ceil(total / query.limit);
        return {
            pagination: {
                total,
                page: query.page,
                limit: query.limit,
                totalPages,
            },
            vehicles,
        };
    }
    /**
     * Retrieves vehicle details.
     */
    async getVehicleDetails(id) {
        const vehicle = await this.vehicleRepository.findById(id);
        if (!vehicle) {
            logger_1.default.warn(`VehicleService: Vehicle details not found for ID ${id}`);
            throw new app_error_1.NotFoundError('Vehicle not found.');
        }
        return vehicle;
    }
    /**
     * Performs partial updates on vehicle properties. Restricted to the owner.
     */
    async updateVehicle(id, ownerId, userRole, dto) {
        logger_1.default.info(`VehicleService: Updating vehicle ${id} by owner/admin ${ownerId}`);
        const vehicle = await this.vehicleRepository.findById(id);
        if (!vehicle) {
            logger_1.default.warn(`VehicleService: Update failed. Vehicle not found for ID ${id}`);
            throw new app_error_1.NotFoundError('Vehicle not found.');
        }
        // Authorize: Only the owner or an admin can update the vehicle
        if (vehicle.ownerId !== ownerId && userRole !== client_1.Role.ADMIN) {
            logger_1.default.warn(`VehicleService: Authorization denied for user ${ownerId} updating vehicle ${id}`);
            throw new app_error_1.ForbiddenError('You are not authorized to update this vehicle listing.');
        }
        // Validate number plate uniqueness if modified
        if (dto.vehicleNumber) {
            const normalizedRegNum = dto.vehicleNumber.toUpperCase().trim();
            if (normalizedRegNum !== vehicle.vehicleNumber) {
                const existingVehicle = await this.vehicleRepository.findByVehicleNumber(normalizedRegNum);
                if (existingVehicle) {
                    logger_1.default.warn(`VehicleService: Update failed. Duplicate license plate: ${normalizedRegNum}`);
                    throw new app_error_1.ConflictError('A vehicle with this registration number is already registered.');
                }
                dto.vehicleNumber = normalizedRegNum;
            }
        }
        const updatedVehicle = await this.vehicleRepository.update(id, dto);
        logger_1.default.info(`VehicleService: Vehicle ${id} updated successfully`);
        return updatedVehicle;
    }
    /**
     * Soft deletes a vehicle by setting its status to SUSPENDED.
     */
    async deleteVehicle(id, ownerId, userRole) {
        logger_1.default.info(`VehicleService: Delete requested for vehicle ${id} by owner/admin ${ownerId}`);
        const vehicle = await this.vehicleRepository.findById(id);
        if (!vehicle) {
            logger_1.default.warn(`VehicleService: Delete failed. Vehicle not found for ID ${id}`);
            throw new app_error_1.NotFoundError('Vehicle not found.');
        }
        // Authorize: Only the owner or an admin can delete the vehicle
        if (vehicle.ownerId !== ownerId && userRole !== client_1.Role.ADMIN) {
            logger_1.default.warn(`VehicleService: Authorization denied for user ${ownerId} deleting vehicle ${id}`);
            throw new app_error_1.ForbiddenError('You are not authorized to delete this vehicle listing.');
        }
        // Perform soft delete status update
        const updatedVehicle = await this.vehicleRepository.update(id, {
            status: client_1.VehicleStatus.SUSPENDED,
            isAvailable: false, // Mark unavailable as well
        });
        logger_1.default.info(`VehicleService: Vehicle ${id} successfully soft deleted (suspended)`);
        return updatedVehicle;
    }
    /**
     * Retrieves vehicles owned by the authenticated owner.
     */
    async listMyVehicles(ownerId, page, limit) {
        logger_1.default.info(`VehicleService: Fetching owner listings for owner ${ownerId}`);
        const { total, vehicles } = await this.vehicleRepository.listByOwner(ownerId, page, limit);
        const totalPages = Math.ceil(total / limit);
        return {
            pagination: {
                total,
                page,
                limit,
                totalPages,
            },
            vehicles,
        };
    }
}
exports.VehicleService = VehicleService;
exports.default = VehicleService;
