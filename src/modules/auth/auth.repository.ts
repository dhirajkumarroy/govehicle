import { Prisma, User, Otp, OtpType } from '@prisma/client';
import prisma from '../../config/database';

export class AuthRepository {
  /**
   * Find a user by their unique email address.
   * @param email Email address of the user.
   */
  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email },
    });
  }

  /**
   * Find a user by their unique phone number.
   * @param phone Phone number of the user.
   */
  async findByPhone(phone: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { phone },
    });
  }

  /**
   * Creates a User and an associated OTP code atomically inside a database transaction.
   * @param userData Input data for the user profile creation.
   * @param otpCode The random OTP code generated.
   * @param otpExpiresAt Expiration date for the OTP.
   */
  async createUserWithOtp(
    userData: Prisma.UserCreateInput,
    otpCode: string,
    otpExpiresAt: Date
  ): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: userData,
      });

      await tx.otp.create({
        data: {
          email: user.email,
          code: otpCode,
          type: 'EMAIL_VERIFICATION',
          expiresAt: otpExpiresAt,
        },
      });

      return user;
    });
  }

  /**
   * Finds the latest OTP code record created for a given email and type.
   * @param email Target user email address.
   * @param type The role/intent of this OTP.
   */
  async findLatestOtp(email: string, type: OtpType): Promise<Otp | null> {
    return prisma.otp.findFirst({
      where: { email, type },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Creates a new OTP record.
   * @param email The target user email.
   * @param code The numeric OTP code string.
   * @param type The purpose of this OTP.
   * @param expiresAt The date/time when this code expires.
   */
  async createOtp(
    email: string,
    code: string,
    type: OtpType,
    expiresAt: Date
  ): Promise<Otp> {
    return prisma.otp.create({
      data: {
        email,
        code,
        type,
        expiresAt,
      },
    });
  }

  /**
   * Verifies a user's email address and deletes their verification OTP atomically.
   * @param userId The ID of the user to verify.
   * @param otpId The ID of the OTP record to delete.
   */
  async transactionalVerifyUserEmail(userId: string, otpId: string): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { isEmailVerified: true },
      });

      await tx.otp.delete({
        where: { id: otpId },
      });

      return user;
    });
  }

  /**
   * Resets a user's password and deletes their recovery OTP atomically.
   * @param userId The ID of the user.
   * @param newPasswordHash The hashed new password to set.
   * @param otpId The ID of the OTP record to delete.
   */
  async transactionalResetPassword(
    userId: string,
    newPasswordHash: string,
    otpId: string
  ): Promise<User> {
    return prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: { password: newPasswordHash },
      });

      await tx.otp.delete({
        where: { id: otpId },
      });

      return user;
    });
  }
}

export default AuthRepository;
