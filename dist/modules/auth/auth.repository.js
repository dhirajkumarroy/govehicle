"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthRepository = void 0;
const database_1 = __importDefault(require("../../config/database"));
class AuthRepository {
    /**
     * Find a user by their unique email address.
     * @param email Email address of the user.
     */
    async findByEmail(email) {
        return database_1.default.user.findUnique({
            where: { email },
        });
    }
    /**
     * Find a user by their unique phone number.
     * @param phone Phone number of the user.
     */
    async findByPhone(phone) {
        return database_1.default.user.findUnique({
            where: { phone },
        });
    }
    /**
     * Creates a User and an associated OTP code atomically inside a database transaction.
     * @param userData Input data for the user profile creation.
     * @param otpCode The random OTP code generated.
     * @param otpExpiresAt Expiration date for the OTP.
     */
    async createUserWithOtp(userData, otpCode, otpExpiresAt) {
        return database_1.default.$transaction(async (tx) => {
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
     * Find an OTP record by email, code, and type.
     */
    async findOtp(email, code, type) {
        return database_1.default.otp.findFirst({
            where: {
                email,
                code,
                type,
            },
        });
    }
    /**
     * Updates user email verification status and deletes the verified OTP record atomically in a transaction.
     */
    async verifyUserEmailAndDeleteOtp(email, otpId) {
        await database_1.default.$transaction(async (tx) => {
            await tx.user.update({
                where: { email },
                data: { isEmailVerified: true },
            });
            await tx.otp.delete({
                where: { id: otpId },
            });
        });
    }
    /**
     * Find a user by their unique database ID.
     * @param id Database ID of the user.
     */
    async findById(id) {
        return database_1.default.user.findUnique({
            where: { id },
        });
    }
    /**
     * Creates a new OTP record.
     */
    async createOtp(email, code, type, expiresAt) {
        return database_1.default.otp.create({
            data: {
                email,
                code,
                type,
                expiresAt,
            },
        });
    }
    /**
     * Deletes all OTP records of a certain type for an email.
     */
    async deleteOtps(email, type) {
        await database_1.default.otp.deleteMany({
            where: { email, type },
        });
    }
    /**
     * Updates user password and deletes the verified OTP record atomically in a transaction.
     */
    async resetUserPasswordAndDeleteOtps(email, passwordHash, otpId) {
        await database_1.default.$transaction(async (tx) => {
            await tx.user.update({
                where: { email },
                data: { password: passwordHash },
            });
            await tx.otp.delete({
                where: { id: otpId },
            });
        });
    }
}
exports.AuthRepository = AuthRepository;
exports.default = AuthRepository;
