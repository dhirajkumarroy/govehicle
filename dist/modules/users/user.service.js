"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const user_repository_1 = require("./user.repository");
const app_error_1 = require("../../common/utils/app-error");
const logger_1 = __importDefault(require("../../config/logger"));
class UserService {
    userRepository;
    constructor() {
        this.userRepository = new user_repository_1.UserRepository();
    }
    /**
     * Retrieves profile details of the user by ID and omits the password field.
     * @param userId User database ID.
     */
    async getProfile(userId) {
        logger_1.default.info(`UserService: Fetching user profile for ID ${userId}`);
        const user = await this.userRepository.findById(userId);
        if (!user) {
            logger_1.default.warn(`UserService: Profile fetch failed. User not found for ID ${userId}`);
            throw new app_error_1.NotFoundError('User profile not found.');
        }
        // Exclude password hash from profile data return
        const { password, ...profile } = user;
        logger_1.default.info(`UserService: Successfully retrieved profile for email: ${profile.email}`);
        return profile;
    }
    /**
     * Updates name and phone of the user profile after confirming validity and uniqueness constraints.
     * @param userId User database ID.
     * @param dto Request data containing optional name and phone.
     */
    async updateProfile(userId, dto) {
        const { name, phone } = dto;
        logger_1.default.info(`UserService: Updating user profile for ID ${userId}`);
        // 1. Confirm user profile exists
        const user = await this.userRepository.findById(userId);
        if (!user) {
            logger_1.default.warn(`UserService: Profile update failed. User not found for ID ${userId}`);
            throw new app_error_1.NotFoundError('User profile not found.');
        }
        // 2. Validate phone number uniqueness if it is being modified
        if (phone && phone !== user.phone) {
            const existingUserWithPhone = await this.userRepository.findByPhone(phone);
            if (existingUserWithPhone) {
                logger_1.default.warn(`UserService: Profile update failed. Phone already registered by another user: ${phone}`);
                throw new app_error_1.ConflictError('A user with this phone number already exists.');
            }
        }
        // 3. Perform the update
        const updatedUser = await this.userRepository.update(userId, {
            name: name ?? undefined,
            phone: phone ?? undefined,
        });
        logger_1.default.info(`UserService: Profile successfully updated for user email ${updatedUser.email}`);
        // Exclude password hash from profile data return
        const { password, ...profile } = updatedUser;
        return profile;
    }
}
exports.UserService = UserService;
exports.default = UserService;
