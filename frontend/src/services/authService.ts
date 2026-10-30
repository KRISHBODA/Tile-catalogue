import { apiClient } from "./apiClient";

export interface UserRole {
  id: string;
  name: string;
  permissions: string[];
}

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  status: "ACTIVE" | "INACTIVE" | "SUSPENDED";
  role: UserRole;
  lastLoginAt: string | null;
}

export interface LoginResponse {
  user: AuthUser;
  token: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>("/auth/login", payload);
    if (res?.token) {
      apiClient.setToken(res.token);
    }
    return res;
  },

  getProfile: async (): Promise<AuthUser> => {
    return apiClient.get<AuthUser>("/auth/me");
  },

  logout: (): void => {
    apiClient.clearToken();
  },

  isAuthenticated: (): boolean => {
    return !!apiClient.getToken();
  },
};
