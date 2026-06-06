import { User } from '@prisma/client';
import { UserRepository } from './user.repository';
import { NotFoundError } from '../../common/utils/app-error';
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
}

export default UserService;
