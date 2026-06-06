import { User } from '@prisma/client';
import prisma from '../../config/database';

export class UserRepository {
  /**
   * Find a user profile in the database by their unique ID.
   * @param id The database user uuid.
   */
  async findById(id: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { id },
    });
  }
}

export default UserRepository;
