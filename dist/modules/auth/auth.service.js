"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const auth_repository_1 = require("./auth.repository");
const hash_password_1 = require("../../common/utils/hash-password");
const compare_password_1 = require("../../common/utils/compare-password");
const generate_otp_1 = require("../../common/utils/generate-otp");
const generate_jwt_1 = require("../../common/utils/generate-jwt");
const app_error_1 = require("../../common/utils/app-error");
const logger_1 = __importDefault(require("../../config/logger"));
class AuthService {
    authRepository;
    constructor() {
        this.authRepository = new auth_repository_1.AuthRepository();
    }
    /**
     * Registers a new user, hashes password, and saves transactionally with a verification OTP.
     */
    async register(dto) {
        const { name, email, phone, password } = dto;
        logger_1.default.info(`Attempting to register new user with email: ${email}`);
        const existingEmail = await this.authRepository.findByEmail(email);
        if (existingEmail) {
            logger_1.default.warn(`Registration failed. Email already registered: ${email}`);
            throw new app_error_1.ConflictError('A user with this email address already exists.');
        }
        const existingPhone = await this.authRepository.findByPhone(phone);
        if (existingPhone) {
            logger_1.default.warn(`Registration failed. Phone already registered: ${phone}`);
            throw new app_error_1.ConflictError('A user with this phone number already exists.');
        }
        const hashedPassword = await (0, hash_password_1.hashPassword)(password);
        const otpCode = (0, generate_otp_1.generateOtp)();
        const otpExpiresAt = new Date();
        otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10); // OTP valid for 10 minutes
        const user = await this.authRepository.createUserWithOtp({
            name,
            email,
            phone,
            password: hashedPassword,
            role: 'CUSTOMER',
        }, otpCode, otpExpiresAt);
        logger_1.default.info(`User registered successfully: ${email}. Verification OTP: ${otpCode}`);
        return user;
    }
    /**
     * Verifies registration OTP and updates user's email verification status.
     */
    async verifyOtp(dto) {
        const { email, code } = dto;
        logger_1.default.info(`Verifying registration OTP for email: ${email}`);
        // 1. Fetch latest EMAIL_VERIFICATION OTP
        const latestOtp = await this.authRepository.findLatestOtp(email, 'EMAIL_VERIFICATION');
        if (!latestOtp || latestOtp.code !== code) {
            logger_1.default.warn(`OTP verification failed. Invalid code for email: ${email}`);
            throw new app_error_1.BadRequestError('Invalid verification code.');
        }
        // 2. Guard against expired OTP
        if (new Date() > latestOtp.expiresAt) {
            logger_1.default.warn(`OTP verification failed. Expired code for email: ${email}`);
            throw new app_error_1.BadRequestError('Verification code has expired.');
        }
        // 3. Retrieve user profile
        const user = await this.authRepository.findByEmail(email);
        if (!user) {
            logger_1.default.warn(`OTP verification failed. User profile not found: ${email}`);
            throw new app_error_1.NotFoundError('User profile not found.');
        }
        // 4. Mark verified and delete OTP atomically
        await this.authRepository.transactionalVerifyUserEmail(user.id, latestOtp.id);
        logger_1.default.info(`Email successfully verified for user: ${email}`);
    }
    /**
     * Logs a user in, verifies credentials, and issues authorization tokens.
     */
    async login(dto) {
        const { email, password } = dto;
        logger_1.default.info(`User login attempt with email: ${email}`);
        // 1. Authenticate user exists
        const user = await this.authRepository.findByEmail(email);
        if (!user) {
            logger_1.default.warn(`Login failed. Invalid email: ${email}`);
            throw new app_error_1.UnauthorizedError('Invalid email address or password.');
        }
        // 2. Authenticate password matches
        const isPasswordMatch = await (0, compare_password_1.comparePassword)(password, user.password);
        if (!isPasswordMatch) {
            logger_1.default.warn(`Login failed. Password mismatch for email: ${email}`);
            throw new app_error_1.UnauthorizedError('Invalid email address or password.');
        }
        // 3. Confirm email verification status
        if (!user.isEmailVerified) {
            logger_1.default.warn(`Login blocked. Unverified email: ${email}`);
            throw new app_error_1.ForbiddenError('Your email address is not verified. Please verify your email first.');
        }
        // 4. Sign JWT Tokens
        const payload = { userId: user.id, email: user.email, role: user.role };
        const accessToken = (0, generate_jwt_1.generateAccessToken)(payload);
        const refreshToken = (0, generate_jwt_1.generateRefreshToken)(payload);
        logger_1.default.info(`User logged in successfully: ${email}`);
        return { user, accessToken, refreshToken };
    }
    /**
     * Generates a password recovery OTP code if the email exists.
     */
    async forgotPassword(dto) {
        const { email } = dto;
        logger_1.default.info(`Forgot password request for email: ${email}`);
        const user = await this.authRepository.findByEmail(email);
        if (!user) {
            // Return success to prevent email verification harvesting attacks
            logger_1.default.warn(`Forgot password request completed. Email not found (silently returning success): ${email}`);
            return;
        }
        // Generate reset code
        const otpCode = (0, generate_otp_1.generateOtp)();
        const otpExpiresAt = new Date();
        otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10); // OTP valid for 10 minutes
        await this.authRepository.createOtp(email, otpCode, 'PASSWORD_RESET', otpExpiresAt);
        logger_1.default.info(`Forgot password OTP generated for ${email}. Reset code: ${otpCode}`);
    }
    /**
     * Verifies reset OTP code and updates user's password atomically.
     */
    async resetPassword(dto) {
        const { email, code, newPassword } = dto;
        logger_1.default.info(`Resetting password for email: ${email}`);
        // 1. Retrieve user profile
        const user = await this.authRepository.findByEmail(email);
        if (!user) {
            logger_1.default.warn(`Password reset failed. User profile not found: ${email}`);
            throw new app_error_1.NotFoundError('User profile not found.');
        }
        // 2. Fetch latest PASSWORD_RESET OTP
        const latestOtp = await this.authRepository.findLatestOtp(email, 'PASSWORD_RESET');
        if (!latestOtp || latestOtp.code !== code) {
            logger_1.default.warn(`Password reset failed. Invalid reset code for: ${email}`);
            throw new app_error_1.BadRequestError('Invalid reset code.');
        }
        // 3. Guard against expired OTP
        if (new Date() > latestOtp.expiresAt) {
            logger_1.default.warn(`Password reset failed. Expired code for: ${email}`);
            throw new app_error_1.BadRequestError('Reset code has expired.');
        }
        // 4. Hash new password and write atomically
        const newPasswordHash = await (0, hash_password_1.hashPassword)(newPassword);
        await this.authRepository.transactionalResetPassword(user.id, newPasswordHash, latestOtp.id);
        logger_1.default.info(`Password successfully reset for email: ${email}`);
    }
    /**
     * Verifies long-lived session cookie and issues a fresh Access Token.
     */
    async refreshToken(refreshTokenStr) {
        logger_1.default.info('Attempting to refresh access token using session refresh token.');
        try {
            // 1. Verify token signature and integrity
            const decoded = (0, generate_jwt_1.verifyRefreshToken)(refreshTokenStr);
            // 2. Confirm user still exists
            const user = await this.authRepository.findByEmail(decoded.email);
            if (!user) {
                throw new app_error_1.UnauthorizedError('User profile not found.');
            }
            // 3. Issue a fresh access token
            const accessToken = (0, generate_jwt_1.generateAccessToken)({
                userId: user.id,
                email: user.email,
                role: user.role,
            });
            logger_1.default.info(`Access token successfully refreshed for email: ${user.email}`);
            return { accessToken };
        }
        catch (error) {
            logger_1.default.warn('Token refresh failed. Refresh token was invalid or expired.');
            throw new app_error_1.UnauthorizedError('Session expired. Please log in again.');
        }
    }
}
exports.AuthService = AuthService;
exports.default = AuthService;
