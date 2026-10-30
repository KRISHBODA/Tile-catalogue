import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { userRepository } from '../repositories/user.repository.js';
import { ForbiddenError, UnauthorizedError } from '../utils/appError.js';
import { ResponseMessages } from '../constants/responseMessages.js';
import { JwtPayloadData, UserEntity } from '../types/auth.types.js';

export interface AuthenticatedRequest extends Request {
  user?: UserEntity;
}

/**
 * Middleware: Verify Bearer JWT Token and populate req.user
 */
export const authenticate = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError(ResponseMessages.UNAUTHORIZED);
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      throw new UnauthorizedError(ResponseMessages.UNAUTHORIZED);
    }

    let decoded: JwtPayloadData;
    try {
      decoded = jwt.verify(token, env.JWT_ACCESS_SECRET) as JwtPayloadData;
    } catch {
      try {
        decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayloadData;
      } catch {
        throw new UnauthorizedError(ResponseMessages.UNAUTHORIZED);
      }
    }

    const user = await userRepository.findById(decoded.id);
    if (!user) {
      throw new UnauthorizedError(ResponseMessages.USER_NOT_FOUND);
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError(ResponseMessages.ACCOUNT_INACTIVE);
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Middleware Factory: Require specific roles (SUPER_ADMIN always has access)
 */
export const requireRole = (...roles: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.role) {
      return next(new UnauthorizedError(ResponseMessages.UNAUTHORIZED));
    }

    const userRole = req.user.role.name;
    if (userRole === 'SUPER_ADMIN' || roles.includes(userRole)) {
      return next();
    }

    return next(new ForbiddenError(ResponseMessages.FORBIDDEN));
  };
};

/**
 * Middleware Factory: Require specific permission code (SUPER_ADMIN always has access)
 */
export const requirePermission = (...requiredPermissions: string[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.role) {
      return next(new UnauthorizedError(ResponseMessages.UNAUTHORIZED));
    }

    // SUPER_ADMIN has master bypass for all permissions
    if (req.user.role.name === 'SUPER_ADMIN') {
      return next();
    }

    const userPermCodes = req.user.role.permissions?.map((p) => p.code) || [];
    const hasAll = requiredPermissions.every((perm) => userPermCodes.includes(perm));

    if (!hasAll) {
      return next(new ForbiddenError(ResponseMessages.FORBIDDEN));
    }

    return next();
  };
};
