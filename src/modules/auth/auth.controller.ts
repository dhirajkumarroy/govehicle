import { Request, Response, NextFunction } from 'express';
import { AuthService } from './auth.service';
import { registerSchema, loginSchema, verifyEmailSchema } from './auth.validation';
import { ResponseDto } from '../../common/dto/api-response.dto';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * HTTP handler to register a new user account.
   * POST /api/v1/auth/register
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = registerSchema.parse(req.body);
      await this.authService.register(validatedBody);

      res.status(201).json(
        ResponseDto.success('Registration successful. Verification OTP sent.')
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * HTTP handler to log in user credentials.
   * POST /api/v1/auth/login
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = loginSchema.parse(req.body);
      const result = await this.authService.login(validatedBody);

      res.status(200).json(
        ResponseDto.success('Login successful', {
          user: {
            id: result.user.id,
            name: result.user.name,
            email: result.user.email,
            phone: result.user.phone,
            role: result.user.role,
            avatar: result.user.avatar,
          },
          accessToken: result.accessToken,
          refreshToken: result.refreshToken,
        })
      );
    } catch (error) {
      next(error);
    }
  };

  /**
   * HTTP handler to verify user's email address.
   * POST /api/v1/auth/verify-email
   */
  verifyEmail = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const validatedBody = verifyEmailSchema.parse(req.body);
      await this.authService.verifyEmail(validatedBody);

      res.status(200).json(
        ResponseDto.success('Email verified successfully.')
      );
    } catch (error) {
      next(error);
    }
  };
}

export default AuthController;

