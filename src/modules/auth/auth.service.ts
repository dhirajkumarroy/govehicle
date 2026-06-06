import { User } from '@prisma/client';
import { AuthRepository } from './auth.repository';
import { RegisterRequestDto, LoginRequestDto, VerifyEmailRequestDto } from './auth.types';
import { hashPassword } from '../../common/utils/hash-password';
import { comparePassword } from '../../common/utils/compare-password';
import { generateOtp } from '../../common/utils/generate-otp';
import {
  generateAccessToken,
  generateRefreshToken,
} from '../../common/utils/generate-jwt';
import {
  ConflictError,
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
  NotFoundError,
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
   * Verifies the user's email address using the registration OTP code.
   */
  async verifyEmail(dto: VerifyEmailRequestDto): Promise<void> {
    const { email, otp } = dto;

    logger.info(`Attempting to verify email: ${email} with OTP: ${otp}`);

    // 1. Retrieve user to check if they exist or are already verified
    const user = await this.authRepository.findByEmail(email);
    if (!user) {
      logger.warn(`Email verification failed. User not found: ${email}`);
      throw new NotFoundError('User not found.');
    }

    if (user.isEmailVerified) {
      logger.warn(`Email verification skipped. Email already verified: ${email}`);
      throw new BadRequestError('Email address is already verified.');
    }

    // 2. Look up the OTP record
    const otpRecord = await this.authRepository.findOtp(email, otp, 'EMAIL_VERIFICATION');
    if (!otpRecord) {
      logger.warn(`Email verification failed. Invalid OTP code: ${otp} for email: ${email}`);
      throw new BadRequestError('Invalid OTP code or email address.');
    }

    // 3. Check for OTP expiration
    const now = new Date();
    if (otpRecord.expiresAt < now) {
      logger.warn(`Email verification failed. OTP code expired for email: ${email}`);
      throw new BadRequestError('OTP has expired. Please request a new one.');
    }

    // 4. Confirm verification and delete the OTP atomically in a transaction
    await this.authRepository.verifyUserEmailAndDeleteOtp(email, otpRecord.id);

    logger.info(`Email verification successful for user: ${email}`);
  }
}

export default AuthService;

