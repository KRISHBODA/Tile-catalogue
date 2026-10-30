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

export interface AuthResponseData {
  user: UserProfile;
  token: string;
}

export interface JwtPayloadData {
  id: string;
  email: string;
  role: string;
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
 * SERVICE INTERFACE: IAuthService
 * Business Logic Layer contract exclusively for authentication rules and token handling.
 */
export interface IAuthService {
  login(dto: LoginDTO): Promise<AuthResponseData>;
  getProfile(userId: string): Promise<UserProfile>;
}
