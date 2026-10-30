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
  accessToken: string;
  refreshToken: string;
  token?: string;
}

export interface RefreshResponse {
  accessToken: string;
  refreshToken: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export const authService = {
  login: async (payload: LoginPayload): Promise<LoginResponse> => {
    const res = await apiClient.post<LoginResponse>("/auth/login", payload);
    if (res?.accessToken || res?.token) {
      apiClient.setTokens({
        accessToken: res.accessToken || res.token,
        refreshToken: res.refreshToken,
      });
    }
    return res;
  },

  refreshToken: async (token?: string): Promise<RefreshResponse> => {
    const currentRefreshToken = token || apiClient.getRefreshToken();
    const res = await apiClient.post<RefreshResponse>("/auth/refresh", {
      refreshToken: currentRefreshToken,
    });
    if (res?.accessToken) {
      apiClient.setTokens({
        accessToken: res.accessToken,
        refreshToken: res.refreshToken,
      });
    }
    return res;
  },

  getProfile: async (): Promise<AuthUser> => {
    return apiClient.get<AuthUser>("/auth/me");
  },

  logout: async (): Promise<void> => {
    const currentRefreshToken = apiClient.getRefreshToken();
    try {
      if (currentRefreshToken) {
        await apiClient.post("/auth/logout", {
          refreshToken: currentRefreshToken,
        });
      }
    } catch {
      // Ignore network errors on logout
    } finally {
      apiClient.clearTokens();
    }
  },

  isAuthenticated: (): boolean => {
    return !!apiClient.getAccessToken();
  },
};
