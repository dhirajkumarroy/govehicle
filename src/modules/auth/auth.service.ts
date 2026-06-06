import { User } from '@prisma/client';
import { AuthRepository } from './auth.repository';
import {
  RegisterRequestDto,
  LoginRequestDto,
  VerifyOtpRequestDto,
  ForgotPasswordRequestDto,
  ResetPasswordRequestDto,
} from './auth.types';
import { hashPassword } from '../../common/utils/hash-password';
import { comparePassword } from '../../common/utils/compare-password';
import { generateOtp } from '../../common/utils/generate-otp';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../common/utils/generate-jwt';
import {
  ConflictError,
  NotFoundError,
  BadRequestError,
  UnauthorizedError,
  ForbiddenError,
} from '../../common/utils/app-error';
import logger from '../../config/logger';

export class AuthService {
  private authRepository: AuthRepository;

  constructor() {
    this.authRepository = new AuthRepository();
  }

  /**
   * Registers a new user, hashes password, and saves transactionally with a verification OTP.
   */
  async register(dto: RegisterRequestDto): Promise<User> {
    const { name, email, phone, password } = dto;

    logger.info(`Attempting to register new user with email: ${email}`);

    const existingEmail = await this.authRepository.findByEmail(email);
    if (existingEmail) {
      logger.warn(`Registration failed. Email already registered: ${email}`);
      throw new ConflictError('A user with this email address already exists.');
    }

    const existingPhone = await this.authRepository.findByPhone(phone);
    if (existingPhone) {
      logger.warn(`Registration failed. Phone already registered: ${phone}`);
      throw new ConflictError('A user with this phone number already exists.');
    }

    const hashedPassword = await hashPassword(password);
    const otpCode = generateOtp();
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10); // OTP valid for 10 minutes

    const user = await this.authRepository.createUserWithOtp(
      {
        name,
        email,
        phone,
        password: hashedPassword,
        role: 'CUSTOMER',
      },
      otpCode,
      otpExpiresAt
    );

    logger.info(`User registered successfully: ${email}. Verification OTP: ${otpCode}`);

    return user;
  }

  /**
   * Verifies registration OTP and updates user's email verification status.
   */
  async verifyOtp(dto: VerifyOtpRequestDto): Promise<void> {
    const { email, code } = dto;

    logger.info(`Verifying registration OTP for email: ${email}`);

    // 1. Fetch latest EMAIL_VERIFICATION OTP
    const latestOtp = await this.authRepository.findLatestOtp(email, 'EMAIL_VERIFICATION');
    if (!latestOtp || latestOtp.code !== code) {
      logger.warn(`OTP verification failed. Invalid code for email: ${email}`);
      throw new BadRequestError('Invalid verification code.');
    }

    // 2. Guard against expired OTP
    if (new Date() > latestOtp.expiresAt) {
      logger.warn(`OTP verification failed. Expired code for email: ${email}`);
      throw new BadRequestError('Verification code has expired.');
    }

    // 3. Retrieve user profile
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      logger.warn(`OTP verification failed. User profile not found: ${email}`);
      throw new NotFoundError('User profile not found.');
    }

    // 4. Mark verified and delete OTP atomically
    await this.authRepository.transactionalVerifyUserEmail(user.id, latestOtp.id);

    logger.info(`Email successfully verified for user: ${email}`);
  }

  /**
   * Logs a user in, verifies credentials, and issues authorization tokens.
   */
  async login(dto: LoginRequestDto): Promise<{ user: User; accessToken: string; refreshToken: string }> {
    const { email, password } = dto;

    logger.info(`User login attempt with email: ${email}`);

    // 1. Authenticate user exists
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      logger.warn(`Login failed. Invalid email: ${email}`);
      throw new UnauthorizedError('Invalid email address or password.');
    }

    // 2. Authenticate password matches
    const isPasswordMatch = await comparePassword(password, user.password);
    if (!isPasswordMatch) {
      logger.warn(`Login failed. Password mismatch for email: ${email}`);
      throw new UnauthorizedError('Invalid email address or password.');
    }

    // 3. Confirm email verification status
    if (!user.isEmailVerified) {
      logger.warn(`Login blocked. Unverified email: ${email}`);
      throw new ForbiddenError('Your email address is not verified. Please verify your email first.');
    }

    // 4. Sign JWT Tokens
    const payload = { userId: user.id, email: user.email, role: user.role };
    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    logger.info(`User logged in successfully: ${email}`);

    return { user, accessToken, refreshToken };
  }

  /**
   * Generates a password recovery OTP code if the email exists.
   */
  async forgotPassword(dto: ForgotPasswordRequestDto): Promise<void> {
    const { email } = dto;

    logger.info(`Forgot password request for email: ${email}`);

    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      // Return success to prevent email verification harvesting attacks
      logger.warn(`Forgot password request completed. Email not found (silently returning success): ${email}`);
      return;
    }

    // Generate reset code
    const otpCode = generateOtp();
    const otpExpiresAt = new Date();
    otpExpiresAt.setMinutes(otpExpiresAt.getMinutes() + 10); // OTP valid for 10 minutes

    await this.authRepository.createOtp(email, otpCode, 'PASSWORD_RESET', otpExpiresAt);

    logger.info(`Forgot password OTP generated for ${email}. Reset code: ${otpCode}`);
  }

  /**
   * Verifies reset OTP code and updates user's password atomically.
   */
  async resetPassword(dto: ResetPasswordRequestDto): Promise<void> {
    const { email, code, newPassword } = dto;

    logger.info(`Resetting password for email: ${email}`);

    // 1. Retrieve user profile
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      logger.warn(`Password reset failed. User profile not found: ${email}`);
      throw new NotFoundError('User profile not found.');
    }

    // 2. Fetch latest PASSWORD_RESET OTP
    const latestOtp = await this.authRepository.findLatestOtp(email, 'PASSWORD_RESET');
    if (!latestOtp || latestOtp.code !== code) {
      logger.warn(`Password reset failed. Invalid reset code for: ${email}`);
      throw new BadRequestError('Invalid reset code.');
    }

    // 3. Guard against expired OTP
    if (new Date() > latestOtp.expiresAt) {
      logger.warn(`Password reset failed. Expired code for: ${email}`);
      throw new BadRequestError('Reset code has expired.');
    }

    // 4. Hash new password and write atomically
    const newPasswordHash = await hashPassword(newPassword);
    await this.authRepository.transactionalResetPassword(user.id, newPasswordHash, latestOtp.id);

    logger.info(`Password successfully reset for email: ${email}`);
  }

  /**
   * Verifies long-lived session cookie and issues a fresh Access Token.
   */
  async refreshToken(refreshTokenStr: string): Promise<{ accessToken: string }> {
    logger.info('Attempting to refresh access token using session refresh token.');

    try {
      // 1. Verify token signature and integrity
      const decoded = verifyRefreshToken(refreshTokenStr);

      // 2. Confirm user still exists
      const user = await this.authRepository.findByEmail(decoded.email);
      if (!user) {
        throw new UnauthorizedError('User profile not found.');
      }

      // 3. Issue a fresh access token
      const accessToken = generateAccessToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      });

      logger.info(`Access token successfully refreshed for email: ${user.email}`);

      return { accessToken };
    } catch (error) {
      logger.warn('Token refresh failed. Refresh token was invalid or expired.');
      throw new UnauthorizedError('Session expired. Please log in again.');
    }
  }
}

export default AuthService;
