"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserController = void 0;
const user_service_1 = require("./user.service");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
const app_error_1 = require("../../common/utils/app-error");
const logger_1 = __importDefault(require("../../config/logger"));
class UserController {
    userService;
    constructor() {
        this.userService = new user_service_1.UserService();
    }
    /**
     * HTTP handler to get the authenticated user's profile.
     * GET /api/v1/users/profile
     */
    getProfile = async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            if (!userId) {
                logger_1.default.warn('UserController: Profile fetch failed due to missing req.user.userId');
                throw new app_error_1.UnauthorizedError('Unauthorized access.');
            }
            const profile = await this.userService.getProfile(userId);
            res.status(200).json(api_response_dto_1.ResponseDto.success('User profile retrieved successfully.', profile));
        }
        catch (error) {
            next(error);
        }
    };
}
exports.UserController = UserController;
exports.default = UserController;
