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
     * Verifies the user's email address using the registration OTP code.
     */
    async verifyEmail(dto) {
        const { email, otp } = dto;
        logger_1.default.info(`Attempting to verify email: ${email} with OTP: ${otp}`);
        // 1. Retrieve user to check if they exist or are already verified
        const user = await this.authRepository.findByEmail(email);
        if (!user) {
            logger_1.default.warn(`Email verification failed. User not found: ${email}`);
            throw new app_error_1.NotFoundError('User not found.');
        }
        if (user.isEmailVerified) {
            logger_1.default.warn(`Email verification skipped. Email already verified: ${email}`);
            throw new app_error_1.BadRequestError('Email address is already verified.');
        }
        // 2. Look up the OTP record
        const otpRecord = await this.authRepository.findOtp(email, otp, 'EMAIL_VERIFICATION');
        if (!otpRecord) {
            logger_1.default.warn(`Email verification failed. Invalid OTP code: ${otp} for email: ${email}`);
            throw new app_error_1.BadRequestError('Invalid OTP code or email address.');
        }
        // 3. Check for OTP expiration
        const now = new Date();
        if (otpRecord.expiresAt < now) {
            logger_1.default.warn(`Email verification failed. OTP code expired for email: ${email}`);
            throw new app_error_1.BadRequestError('OTP has expired. Please request a new one.');
        }
        // 4. Confirm verification and delete the OTP atomically in a transaction
        await this.authRepository.verifyUserEmailAndDeleteOtp(email, otpRecord.id);
        logger_1.default.info(`Email verification successful for user: ${email}`);
    }
    /**
     * Validates refresh token, confirms user identity, and issues new tokens (rotation enabled).
     */
    async refreshToken(dto) {
        const { refreshToken } = dto;
        logger_1.default.info('Attempting to refresh access token using refresh token.');
        let payload;
        try {
            payload = (0, generate_jwt_1.verifyRefreshToken)(refreshToken);
        }
        catch (error) {
            logger_1.default.warn(`Token refresh failed: Invalid or expired refresh token. Error: ${error instanceof Error ? error.message : error}`);
            throw new app_error_1.UnauthorizedError('Invalid or expired refresh token.');
        }
        const user = await this.authRepository.findById(payload.userId);
        if (!user) {
            logger_1.default.warn(`Token refresh failed. User not found for ID: ${payload.userId}`);
            throw new app_error_1.UnauthorizedError('User not found.');
        }
        if (!user.isEmailVerified) {
            logger_1.default.warn(`Token refresh failed. User email is unverified: ${user.email}`);
            throw new app_error_1.ForbiddenError('Your email address is not verified. Please verify your email first.');
        }
        const tokenPayload = { userId: user.id, email: user.email, role: user.role };
        const accessToken = (0, generate_jwt_1.generateAccessToken)(tokenPayload);
        const newRefreshToken = (0, generate_jwt_1.generateRefreshToken)(tokenPayload);
        logger_1.default.info(`Tokens refreshed successfully for user: ${user.email}`);
        return { accessToken, refreshToken: newRefreshToken };
    }
}
exports.AuthService = AuthService;
exports.default = AuthService;
