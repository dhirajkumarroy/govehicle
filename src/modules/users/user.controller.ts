import { Response, NextFunction } from 'express';
import { UserService } from './user.service';
import { updateProfileSchema } from './user.validation';
import { AuthenticatedRequest } from '../../common/interfaces/authenticated-request.interface';
import { ResponseDto } from '../../common/dto/api-response.dto';
import { UnauthorizedError } from '../../common/utils/app-error';
import logger from '../../config/logger';

export class UserController {
  private userService: UserService;

  constructor() {
    this.userService = new UserService();
  }

  /**
   * HTTP handler to get the authenticated user's profile.
   * GET /api/v1/users/profile
   */
  getProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        logger.warn('UserController: Profile fetch failed due to missing req.user.userId');
        throw new UnauthorizedError('Unauthorized access.');
      }

      const profile = await this.userService.getProfile(userId);

      res.status(200).json(
        ResponseDto.success('User profile retrieved successfully.', profile)
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * HTTP handler to update user profile parameters (name, phone).
   * PATCH /api/v1/users/profile
   */
  updateProfile = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    try {
      const userId = req.user?.userId;
      if (!userId) {
        logger.warn('UserController: Profile update failed due to missing req.user.userId');
        throw new UnauthorizedError('Unauthorized access.');
      }

      const validatedBody = updateProfileSchema.parse(req.body);
      const profile = await this.userService.updateProfile(userId, validatedBody);

      res.status(200).json(
        ResponseDto.success('User profile updated successfully.', profile)
      );
    } catch (error) {
      next(error);
    }
  };
}

export default UserController;
