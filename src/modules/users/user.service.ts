import { User } from '@prisma/client';
import { UserRepository } from './user.repository';
import { NotFoundError, ConflictError } from '../../common/utils/app-error';
import { UpdateProfileRequestDto } from './user.types';
import logger from '../../config/logger';

export class UserService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Retrieves profile details of the user by ID and omits the password field.
   * @param userId User database ID.
   */
  async getProfile(userId: string): Promise<Omit<User, 'password'>> {
    logger.info(`UserService: Fetching user profile for ID ${userId}`);

    const user = await this.userRepository.findById(userId);
    if (!user) {
      logger.warn(`UserService: Profile fetch failed. User not found for ID ${userId}`);
      throw new NotFoundError('User profile not found.');
    }

    // Exclude password hash from profile data return
    const { password, ...profile } = user;
    logger.info(`UserService: Successfully retrieved profile for email: ${profile.email}`);

    return profile;
  }

  /**
   * Updates name and phone of the user profile after confirming validity and uniqueness constraints.
   * @param userId User database ID.
   * @param dto Request data containing optional name and phone.
   */
  async updateProfile(userId: string, dto: UpdateProfileRequestDto): Promise<Omit<User, 'password'>> {
    const { name, phone } = dto;
    logger.info(`UserService: Updating user profile for ID ${userId}`);

    // 1. Confirm user profile exists
    const user = await this.userRepository.findById(userId);
    if (!user) {
      logger.warn(`UserService: Profile update failed. User not found for ID ${userId}`);
      throw new NotFoundError('User profile not found.');
    }

    // 2. Validate phone number uniqueness if it is being modified
    if (phone && phone !== user.phone) {
      const existingUserWithPhone = await this.userRepository.findByPhone(phone);
      if (existingUserWithPhone) {
        logger.warn(`UserService: Profile update failed. Phone already registered by another user: ${phone}`);
        throw new ConflictError('A user with this phone number already exists.');
      }
    }

    // 3. Perform the update
    const updatedUser = await this.userRepository.update(userId, {
      name: name ?? undefined,
      phone: phone ?? undefined,
    });

    logger.info(`UserService: Profile successfully updated for user email ${updatedUser.email}`);

    // Exclude password hash from profile data return
    const { password, ...profile } = updatedUser;
    return profile;
  }
}

export default UserService;

