"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserService = void 0;
const path_1 = __importDefault(require("path"));
const user_repository_1 = require("./user.repository");
const app_error_1 = require("../../common/utils/app-error");
const compare_password_1 = require("../../common/utils/compare-password");
const hash_password_1 = require("../../common/utils/hash-password");
const storage_service_1 = require("../uploads/storage.service");
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
    /**
     * Modifies the user password after verifying validity of current password credentials.
     * @param userId User database ID.
     * @param dto Request payload details.
     */
    async changePassword(userId, dto) {
        const { oldPassword, newPassword } = dto;
        logger_1.default.info(`UserService: Password change requested for user ID ${userId}`);
        // 1. Check user exists
        const user = await this.userRepository.findById(userId);
        if (!user) {
            logger_1.default.warn(`UserService: Password change failed. User not found for ID ${userId}`);
            throw new app_error_1.NotFoundError('User profile not found.');
        }
        // 2. Validate current password matches
        const isPasswordMatch = await (0, compare_password_1.comparePassword)(oldPassword, user.password);
        if (!isPasswordMatch) {
            logger_1.default.warn(`UserService: Password change failed. Current password mismatch for user ID ${userId}`);
            throw new app_error_1.BadRequestError('Invalid current password.');
        }
        // 3. Prevent using the same password
        const isSamePassword = await (0, compare_password_1.comparePassword)(newPassword, user.password);
        if (isSamePassword) {
            logger_1.default.warn(`UserService: Password change failed. New password matches current password for user ID ${userId}`);
            throw new app_error_1.BadRequestError('New password cannot be the same as the old password.');
        }
        // 4. Hash new password and update user record
        const hashedPassword = await (0, hash_password_1.hashPassword)(newPassword);
        await this.userRepository.update(userId, {
            password: hashedPassword,
        });
        logger_1.default.info(`UserService: Password successfully updated for user email ${user.email}`);
    }
    /**
     * Uploads a new avatar image, removes the old one from storage, and updates the path in user profile.
     * @param userId User database ID.
     * @param file Express.Multer.File object containing buffer data.
     */
    async updateAvatar(userId, file) {
        logger_1.default.info(`UserService: Uploading avatar image for user ID ${userId}`);
        // 1. Check user exists
        const user = await this.userRepository.findById(userId);
        if (!user) {
            logger_1.default.warn(`UserService: Avatar upload failed. User not found for ID ${userId}`);
            throw new app_error_1.NotFoundError('User profile not found.');
        }
        // 2. Safely delete the old avatar file from storage if one exists
        if (user.avatar) {
            try {
                logger_1.default.info(`UserService: Deleting previous avatar: ${user.avatar}`);
                await storage_service_1.storageService.deleteFile(user.avatar);
            }
            catch (err) {
                logger_1.default.warn(`UserService: Failed to delete previous avatar ${user.avatar}. Proceeding anyway. Error: ${err}`);
            }
        }
        // 3. Generate a unique name for the uploaded file
        const fileExtension = path_1.default.extname(file.originalname) || '.jpg';
        const fileName = `avatar-${userId}-${Date.now()}${fileExtension}`;
        // 4. Upload raw buffer to storage service (local or Cloudinary)
        const fileUrlOrPath = await storage_service_1.storageService.uploadFile(file.buffer, fileName, 'profiles', file.mimetype);
        // 5. Update user database record with the new path/url
        const updatedUser = await this.userRepository.update(userId, {
            avatar: fileUrlOrPath,
        });
        logger_1.default.info(`UserService: Avatar successfully updated for user email ${updatedUser.email}`);
        // Exclude password hash from profile data return
        const { password, ...profile } = updatedUser;
        return profile;
    }
}
exports.UserService = UserService;
exports.default = UserService;
