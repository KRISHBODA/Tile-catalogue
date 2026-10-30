import { prisma } from '../config/database.js';
import { IRefreshTokenRepository, RefreshTokenEntity } from '../types/auth.types.js';

/**
 * DATA ACCESS LAYER: RefreshTokenRepository
 *
 * Responsibility: ONLY direct database access for refresh tokens via Prisma.
 * Strict Rule: ZERO business logic or validation here.
 */
export class RefreshTokenRepository implements IRefreshTokenRepository {
  public async create(data: {
    token: string;
    userId: string;
    expiresAt: Date;
  }): Promise<RefreshTokenEntity> {
    return prisma.refreshToken.create({
      data: {
        token: data.token,
        userId: data.userId,
        expiresAt: data.expiresAt,
      },
    });
  }

  public async findByToken(token: string): Promise<RefreshTokenEntity | null> {
    return prisma.refreshToken.findUnique({
      where: { token },
    });
  }

  public async revokeToken(token: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { token, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  public async revokeAllForUser(userId: string): Promise<void> {
    await prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  public async deleteExpired(): Promise<number> {
    const result = await prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }
}

export const refreshTokenRepository = new RefreshTokenRepository();
