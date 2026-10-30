import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  AuthResponseData,
  IAuthService,
  IUserRepository,
  JwtPayloadData,
  LoginDTO,
  UserProfile,
} from '../types/auth.types.js';
import { userRepository } from '../repositories/user.repository.js';
import { env } from '../config/env.js';
import { BadRequestError, UnauthorizedError } from '../utils/appError.js';
import { ResponseMessages } from '../constants/responseMessages.js';

/**
 * SERVICE LAYER: AuthService
 *
 * Responsibility: ONLY Business Logic, Token Management, and Authentication Rules.
 * Strict Rule: ZERO database queries here. Depends exclusively on IUserRepository contract.
 */
export class AuthService implements IAuthService {
  constructor(private readonly userRepo: IUserRepository = userRepository) {}

  public async login(dto: LoginDTO): Promise<AuthResponseData> {
    if (!dto.email || !dto.password) {
      throw new BadRequestError(ResponseMessages.BAD_REQUEST, {
        email: !dto.email ? 'Email is required.' : undefined,
        password: !dto.password ? 'Password is required.' : undefined,
      });
    }

    const email = dto.email.toLowerCase().trim();
    const user = await this.userRepo.findByEmail(email);

    if (!user) {
      throw new UnauthorizedError(ResponseMessages.INVALID_CREDENTIALS);
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError(ResponseMessages.ACCOUNT_INACTIVE);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError(ResponseMessages.INVALID_CREDENTIALS);
    }

    // Async update last login timestamp
    void this.userRepo.updateLastLogin(user.id);

    const roleName = user.role?.name || 'USER';
    const permissions = user.role?.permissions?.map((p) => p.code) || [];

    const payload: JwtPayloadData = {
      id: user.id,
      email: user.email,
      role: roleName,
    };

    const token = jwt.sign(payload, env.JWT_SECRET, {
      expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const userProfile: UserProfile = {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: {
        id: user.role?.id || '',
        name: roleName,
        permissions,
      },
      lastLoginAt: user.lastLoginAt,
    };

    return {
      user: userProfile,
      token,
    };
  }

  public async getProfile(userId: string): Promise<UserProfile> {
    const user = await this.userRepo.findById(userId);
    if (!user) {
      throw new UnauthorizedError(ResponseMessages.USER_NOT_FOUND);
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedError(ResponseMessages.ACCOUNT_INACTIVE);
    }

    const roleName = user.role?.name || 'USER';
    const permissions = user.role?.permissions?.map((p) => p.code) || [];

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      status: user.status,
      role: {
        id: user.role?.id || '',
        name: roleName,
        permissions,
      },
      lastLoginAt: user.lastLoginAt,
    };
  }
}

export const authService = new AuthService();
