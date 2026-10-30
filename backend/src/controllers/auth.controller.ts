import { Request, Response, NextFunction } from 'express';
import { IAuthService, LoginDTO } from '../types/auth.types.js';
import { authService as defaultAuthService } from '../services/auth.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HttpStatusCodes } from '../constants/httpStatusCodes.js';
import { ResponseMessages } from '../constants/responseMessages.js';
import { BadRequestError, UnauthorizedError } from '../utils/appError.js';
import { AuthenticatedRequest } from '../middlewares/auth.middleware.js';

/**
 * CONTROLLER LAYER: AuthController
 *
 * Responsibility: ONLY Request & Response orchestration for Authentication.
 * Rules:
 * - Unpacks HTTP body/headers.
 * - Delegates directly to IAuthService.
 * - Sends standard ApiResponse.
 */
export class AuthController {
  constructor(private readonly service: IAuthService = defaultAuthService) {}

  public login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const dto: LoginDTO = {
        email: req.body.email,
        password: req.body.password,
      };

      const result = await this.service.login(dto);

      ApiResponse.success(
        res,
        result,
        ResponseMessages.LOGIN_SUCCESS,
        HttpStatusCodes.OK
      );
    } catch (error) {
      next(error);
    }
  };

  public refresh = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.body?.refreshToken;
      if (!refreshToken || typeof refreshToken !== 'string') {
        throw new BadRequestError('Refresh token is required.');
      }

      const tokens = await this.service.refreshToken(refreshToken);

      ApiResponse.success(
        res,
        tokens,
        ResponseMessages.TOKEN_REFRESH_SUCCESS,
        HttpStatusCodes.OK
      );
    } catch (error) {
      next(error);
    }
  };

  public logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const refreshToken = req.body?.refreshToken;
      const userId = (req as AuthenticatedRequest).user?.id;

      await this.service.logout(refreshToken, userId);

      ApiResponse.success(
        res,
        null,
        ResponseMessages.LOGOUT_SUCCESS,
        HttpStatusCodes.OK
      );
    } catch (error) {
      next(error);
    }
  };

  public me = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const userId = (req as AuthenticatedRequest).user?.id;
      if (!userId) {
        throw new UnauthorizedError(ResponseMessages.UNAUTHORIZED);
      }

      const profile = await this.service.getProfile(userId);

      ApiResponse.success(
        res,
        profile,
        ResponseMessages.SUCCESS,
        HttpStatusCodes.OK
      );
    } catch (error) {
      next(error);
    }
  };
}

export const authController = new AuthController();
