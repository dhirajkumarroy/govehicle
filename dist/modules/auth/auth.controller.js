"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthController = void 0;
const auth_service_1 = require("./auth.service");
const auth_validation_1 = require("./auth.validation");
const api_response_dto_1 = require("../../common/dto/api-response.dto");
const env_1 = require("../../config/env");
class AuthController {
    authService;
    constructor() {
        this.authService = new auth_service_1.AuthService();
    }
    /**
     * Helper utility to manually extract a cookie by name from the headers.
     * Prevents dependency errors if cookie-parser is missing.
     */
    getCookieByName(req, name) {
        const cookieHeader = req.headers.cookie;
        if (!cookieHeader)
            return undefined;
        const cookies = cookieHeader.split(';').map((c) => c.trim().split('='));
        const match = cookies.find(([k]) => k === name);
        return match ? decodeURIComponent(match[1]) : undefined;
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
     * HTTP handler to verify registration OTP code.
     * POST /api/v1/auth/verify-otp
     */
    verifyOtp = async (req, res, next) => {
        try {
            const validatedBody = auth_validation_1.verifyOtpSchema.parse(req.body);
            await this.authService.verifyOtp(validatedBody);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Email verified successfully. You can now log in.'));
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
            // Secure HTTP-Only Refresh Token Cookie settings
            const isProduction = env_1.env.NODE_ENV === 'production';
            res.cookie('refreshToken', result.refreshToken, {
                httpOnly: true,
                secure: isProduction, // HTTPS only in production
                sameSite: 'lax',
                path: '/',
                maxAge: 7 * 24 * 60 * 60 * 1000, // 7 Days in milliseconds
            });
            res.status(200).json(api_response_dto_1.ResponseDto.success('Login successful.', {
                user: {
                    id: result.user.id,
                    name: result.user.name,
                    email: result.user.email,
                    phone: result.user.phone,
                    role: result.user.role,
                    avatar: result.user.avatar,
                },
                accessToken: result.accessToken,
            }));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * HTTP handler to initiate password recovery OTP mail.
     * POST /api/v1/auth/forgot-password
     */
    forgotPassword = async (req, res, next) => {
        try {
            const validatedBody = auth_validation_1.forgotPasswordSchema.parse(req.body);
            await this.authService.forgotPassword(validatedBody);
            // Return success messaging uniformly to avoid user harvesting/email enumeration attacks
            res.status(200).json(api_response_dto_1.ResponseDto.success('If the email is registered in our system, a recovery OTP has been sent.'));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * HTTP handler to verify OTP and reset password.
     * POST /api/v1/auth/reset-password
     */
    resetPassword = async (req, res, next) => {
        try {
            const validatedBody = auth_validation_1.resetPasswordSchema.parse(req.body);
            await this.authService.resetPassword(validatedBody);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Password reset successfully. Please log in with your new password.'));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * HTTP handler to issue a fresh Access Token using standard secure Refresh Cookie verification.
     * POST /api/v1/auth/refresh-token
     */
    refreshToken = async (req, res, next) => {
        try {
            // 1. Manually extract refresh token cookie
            const token = this.getCookieByName(req, 'refreshToken');
            if (!token) {
                res.status(401).json(api_response_dto_1.ResponseDto.error('Session expired. Please log in again.'));
                return;
            }
            // 2. Query service to sign a fresh access token
            const result = await this.authService.refreshToken(token);
            res.status(200).json(api_response_dto_1.ResponseDto.success('Access token successfully refreshed.', result));
        }
        catch (error) {
            next(error);
        }
    };
    /**
     * HTTP handler to log user out and destroy secure refresh cookies.
     * POST /api/v1/auth/logout
     */
    logout = async (_req, res, next) => {
        try {
            const isProduction = env_1.env.NODE_ENV === 'production';
            // Clear secure refresh token cookie
            res.clearCookie('refreshToken', {
                httpOnly: true,
                secure: isProduction,
                sameSite: 'lax',
                path: '/',
            });
            res.status(200).json(api_response_dto_1.ResponseDto.success('Logout successful.'));
        }
        catch (error) {
            next(error);
        }
    };
}
exports.AuthController = AuthController;
exports.default = AuthController;
