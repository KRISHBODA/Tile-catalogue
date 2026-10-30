export type UserStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';

export interface PermissionEntity {
  id: string;
  code: string;
  name: string;
  category: string;
}

export interface RoleEntity {
  id: string;
  name: string;
  description: string | null;
  isSystem: boolean;
  permissions?: PermissionEntity[];
}

export interface UserEntity {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  status: UserStatus;
  roleId: string;
  role?: RoleEntity;
  lastLoginAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface RefreshTokenEntity {
  id: string;
  token: string;
  userId: string;
  expiresAt: Date;
  revokedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  status: UserStatus;
  role: {
    id: string;
    name: string;
    permissions: string[];
  };
  lastLoginAt: Date | null;
}

export interface LoginDTO {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponseData {
  user: UserProfile;
  accessToken: string;
  refreshToken: string;
  // Backward compatibility alias for single token
  token: string;
}

export interface JwtPayloadData {
  id: string;
  email: string;
  role: string;
}

export interface JwtRefreshPayloadData {
  id: string;
  tokenId?: string;
}

/**
 * REPOSITORY INTERFACE: IUserRepository
 * Data Access Layer contract exclusively for users & authentication data.
 */
export interface IUserRepository {
  findByEmail(email: string): Promise<UserEntity | null>;
  findById(id: string): Promise<UserEntity | null>;
  updateLastLogin(id: string): Promise<void>;
}

/**
 * REPOSITORY INTERFACE: IRefreshTokenRepository
 * Data Access Layer contract exclusively for refresh token persistence & rotation.
 */
export interface IRefreshTokenRepository {
  create(data: { token: string; userId: string; expiresAt: Date }): Promise<RefreshTokenEntity>;
  findByToken(token: string): Promise<RefreshTokenEntity | null>;
  revokeToken(token: string): Promise<void>;
  revokeAllForUser(userId: string): Promise<void>;
  deleteExpired(): Promise<number>;
}

/**
 * SERVICE INTERFACE: IAuthService
 * Business Logic Layer contract exclusively for authentication rules, access tokens & refresh tokens.
 */
export interface IAuthService {
  login(dto: LoginDTO): Promise<AuthResponseData>;
  refreshToken(token: string): Promise<AuthTokens>;
  logout(refreshToken?: string, userId?: string): Promise<void>;
  getProfile(userId: string): Promise<UserProfile>;
}
