import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import {
  AuthResponseData,
  AuthTokens,
  IAuthService,
  IRefreshTokenRepository,
  IUserRepository,
  JwtPayloadData,
  JwtRefreshPayloadData,
  LoginDTO,
  UserProfile,
} from '../types/auth.types.js';
import { userRepository } from '../repositories/user.repository.js';
import { refreshTokenRepository } from '../repositories/refreshToken.repository.js';
import { env } from '../config/env.js';
import { BadRequestError, UnauthorizedError } from '../utils/appError.js';
import { ResponseMessages } from '../constants/responseMessages.js';

/**
 * SERVICE LAYER: AuthService
 *
 * Responsibility: ONLY Business Logic, Token Management, and Authentication Rules.
 * Strict Rule: ZERO database queries here. Depends exclusively on repository contracts.
 */
export class AuthService implements IAuthService {
  constructor(
    private readonly userRepo: IUserRepository = userRepository,
    private readonly refreshTokenRepo: IRefreshTokenRepository = refreshTokenRepository
  ) {}

  private parseDurationMs(durationStr: string): number {
    const match = durationStr.match(/^(\d+)([smhd])$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000; // default 7 days
    const value = parseInt(match[1], 10);
    const unit = match[2];
    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }

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

    // 1. Generate short-lived Access Token (15m)
    const accessPayload: JwtPayloadData = {
      id: user.id,
      email: user.email,
      role: roleName,
    };

    const accessToken = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    // 2. Generate long-lived Refresh Token (7d)
    const refreshPayload: JwtRefreshPayloadData = {
      id: user.id,
    };

    const refreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    // 3. Persist Refresh Token in DB with expiration
    const refreshDurationMs = this.parseDurationMs(env.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + refreshDurationMs);

    await this.refreshTokenRepo.create({
      token: refreshToken,
      userId: user.id,
      expiresAt,
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
      accessToken,
      refreshToken,
      token: accessToken, // Backward compatibility
    };
  }

  public async refreshToken(token: string): Promise<AuthTokens> {
    if (!token) {
      throw new UnauthorizedError(ResponseMessages.INVALID_REFRESH_TOKEN);
    }

    // 1. Verify Refresh Token signature
    let decoded: JwtRefreshPayloadData;
    try {
      decoded = jwt.verify(token, env.JWT_REFRESH_SECRET) as JwtRefreshPayloadData;
    } catch {
      throw new UnauthorizedError(ResponseMessages.INVALID_REFRESH_TOKEN);
    }

    // 2. Check token record in DB
    const tokenEntity = await this.refreshTokenRepo.findByToken(token);
    if (!tokenEntity) {
      throw new UnauthorizedError(ResponseMessages.INVALID_REFRESH_TOKEN);
    }

    // 3. Security: Detect Token Reuse (Replay Attack)
    if (tokenEntity.revokedAt !== null) {
      // Token was already revoked! Invalidate all tokens for this user for security
      await this.refreshTokenRepo.revokeAllForUser(tokenEntity.userId);
      throw new UnauthorizedError(ResponseMessages.INVALID_REFRESH_TOKEN);
    }

    // 4. Check expiration
    if (tokenEntity.expiresAt.getTime() < Date.now()) {
      await this.refreshTokenRepo.revokeToken(token);
      throw new UnauthorizedError(ResponseMessages.INVALID_REFRESH_TOKEN);
    }

    // 5. Verify user status
    const user = await this.userRepo.findById(tokenEntity.userId);
    if (!user || user.status !== 'ACTIVE') {
      throw new UnauthorizedError(ResponseMessages.ACCOUNT_INACTIVE);
    }

    // 6. Token Rotation: Revoke current refresh token
    await this.refreshTokenRepo.revokeToken(token);

    // 7. Issue new Access Token and new Refresh Token
    const roleName = user.role?.name || 'USER';
    const accessPayload: JwtPayloadData = {
      id: user.id,
      email: user.email,
      role: roleName,
    };

    const newAccessToken = jwt.sign(accessPayload, env.JWT_ACCESS_SECRET, {
      expiresIn: env.JWT_ACCESS_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const refreshPayload: JwtRefreshPayloadData = {
      id: user.id,
    };

    const newRefreshToken = jwt.sign(refreshPayload, env.JWT_REFRESH_SECRET, {
      expiresIn: env.JWT_REFRESH_EXPIRES_IN as jwt.SignOptions['expiresIn'],
    });

    const refreshDurationMs = this.parseDurationMs(env.JWT_REFRESH_EXPIRES_IN);
    const expiresAt = new Date(Date.now() + refreshDurationMs);

    await this.refreshTokenRepo.create({
      token: newRefreshToken,
      userId: user.id,
      expiresAt,
    });

    return {
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    };
  }

  public async logout(refreshToken?: string, userId?: string): Promise<void> {
    if (refreshToken) {
      await this.refreshTokenRepo.revokeToken(refreshToken);
    }
    if (userId) {
      await this.refreshTokenRepo.revokeAllForUser(userId);
    }
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
