"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const auth_validation_1 = require("./auth.validation");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
class AuthController {
    authService;
    constructor() {
        this.authService = new auth_service_1.AuthService();
    }
    /**
     * HTTP handler to register a new user account.
     * POST /api/v1/auth/register
     */
    register = async (req, res, next) => {
        try {
            const validatedBody = auth_validation_1.registerSchema.parse(req.body);
            await this.authService.register(validatedBody);
            res.status(201).json(api_response_dto_1.ResponseDto.success('Registration successful. Verification OTP sent.'));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * HTTP handler to log in user credentials.
     * POST /api/v1/auth/login
     */
    login = async (req, res, next) => {
        try {
            const validatedBody = auth_validation_1.loginSchema.parse(req.body);
            const result = await this.authService.login(validatedBody);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Login successful', {
                user: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    phone: result.user.phone,
                    role: result.user.role,
                    avatar: result.user.avatar,
                },
                accessToken: result.accessToken,
                refreshToken: result.refreshToken,
            }));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * HTTP handler to verify user's email address.
     * POST /api/v1/auth/verify-email
     */
    verifyEmail = async (req, res, next) => {
        try {
            const validatedBody = auth_validation_1.verifyEmailSchema.parse(req.body);
            await this.authService.verifyEmail(validatedBody);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Email verified successfully.'));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * HTTP handler to refresh session tokens.
     * POST /api/v1/auth/refresh-token
     */
    refreshToken = async (req, res, next) => {
        try {
            const validatedBody = auth_validation_1.refreshTokenSchema.parse(req.body);
            const result = await this.authService.refreshToken(validatedBody);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Tokens refreshed successfully.', result));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * HTTP handler to initiate password reset request.
     * POST /api/v1/auth/forgot-password
     */
    forgotPassword = async (req, res, next) => {
        try {
            const validatedBody = auth_validation_1.forgotPasswordSchema.parse(req.body);
            await this.authService.forgotPassword(validatedBody);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Password reset OTP sent to your email address.'));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * HTTP handler to execute password reset using OTP.
     * POST /api/v1/auth/reset-password
     */
    resetPassword = async (req, res, next) => {
        try {
            const validatedBody = auth_validation_1.resetPasswordSchema.parse(req.body);
            await this.authService.resetPassword(validatedBody);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Password has been reset successfully.'));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * HTTP handler to log out user.
     * POST /api/v1/auth/logout
     */
    logout = async (req, res, next) => {
        try {
            const validatedBody = auth_validation_1.logoutSchema.parse(req.body);
            await this.authService.logout(validatedBody);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Logged out successfully.'));
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AuthController = AuthController;
exports.default = AuthController;
