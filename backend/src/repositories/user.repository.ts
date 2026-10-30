import { IUserRepository, UserEntity } from '../types/auth.types.js';
import { prisma } from '../config/database.js';

/**
 * REPOSITORY LAYER: UserRepository
 *
 * Responsibility: ONLY Database / Persistence Operations for Users and Roles.
 * Rules:
 * - NO business logic or password validation here.
 * - Implements IUserRepository.
 */
export class UserRepository implements IUserRepository {
  public async findByEmail(email: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      status: user.status as UserEntity['status'],
      roleId: user.roleId,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
        isSystem: user.role.isSystem,
        permissions: user.role.permissions.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          category: p.category,
        })),
      },
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  public async findById(id: string): Promise<UserEntity | null> {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        role: {
          include: {
            permissions: true,
          },
        },
      },
    });

    if (!user) return null;

    return {
      id: user.id,
      name: user.name,
      email: user.email,
      passwordHash: user.passwordHash,
      status: user.status as UserEntity['status'],
      roleId: user.roleId,
      role: {
        id: user.role.id,
        name: user.role.name,
        description: user.role.description,
        isSystem: user.role.isSystem,
        permissions: user.role.permissions.map((p) => ({
          id: p.id,
          code: p.code,
          name: p.name,
          category: p.category,
        })),
      },
      lastLoginAt: user.lastLoginAt,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  public async updateLastLogin(id: string): Promise<void> {
    await prisma.user.update({
      where: { id },
      data: { lastLoginAt: new Date() },
    });
  }
}

export const userRepository = new UserRepository();
