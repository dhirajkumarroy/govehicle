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
}
exports.UserService = UserService;
exports.default = UserService;
