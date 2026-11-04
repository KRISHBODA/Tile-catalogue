import { API_CONFIG } from "../constants/api.constants";

export class ApiError extends Error {
  public readonly statusCode: number;
  public readonly errors?: unknown;

  constructor(message: string, statusCode: number = 500, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export interface RequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  _retry?: boolean;
  responseType?: "blob";
}

export interface BackendResponse<T = unknown> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  errors?: unknown;
  timestamp: string;
}

class ApiClient {
  private readonly baseUrl: string;
  private accessToken: string | null = null;
  private refreshToken: string | null = null;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseUrl: string = API_CONFIG.BASE_URL) {
    this.baseUrl = baseUrl.replace(/\/+$/, "");
  }

  public setTokens(tokens: { accessToken?: string | null; refreshToken?: string | null }): void {
    if (tokens.accessToken !== undefined) {
      this.accessToken = tokens.accessToken;
      if (typeof window !== "undefined") {
        if (tokens.accessToken) {
          localStorage.setItem("tile_catalog_access_token", tokens.accessToken);
        } else {
          localStorage.removeItem("tile_catalog_access_token");
        }
      }
    }

    if (tokens.refreshToken !== undefined) {
      this.refreshToken = tokens.refreshToken;
      if (typeof window !== "undefined") {
        if (tokens.refreshToken) {
          localStorage.setItem("tile_catalog_refresh_token", tokens.refreshToken);
        } else {
          localStorage.removeItem("tile_catalog_refresh_token");
        }
      }
    }
  }

  public getAccessToken(): string | null {
    if (!this.accessToken && typeof window !== "undefined") {
      this.accessToken =
        localStorage.getItem("tile_catalog_access_token") ||
        localStorage.getItem("tile_catalog_auth_token");
    }
    return this.accessToken;
  }

  public getRefreshToken(): string | null {
    if (!this.refreshToken && typeof window !== "undefined") {
      this.refreshToken = localStorage.getItem("tile_catalog_refresh_token");
    }
    return this.refreshToken;
  }

  public clearTokens(): void {
    this.setTokens({ accessToken: null, refreshToken: null });
    if (typeof window !== "undefined") {
      localStorage.removeItem("tile_catalog_auth_token");
    }
  }

  // Backward compatibility alias methods
  public setToken(token: string | null): void {
    this.setTokens({ accessToken: token });
  }

  public getToken(): string | null {
    return this.getAccessToken();
  }

  public clearToken(): void {
    this.clearTokens();
  }

  private buildUrl(path: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = `${this.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const query = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null && val !== "") query.append(key, String(val));
      });
    }
    const suffix = query.toString();
    return suffix ? `${url}${url.includes("?") ? "&" : "?"}${suffix}` : url;
  }

  private async performTokenRefresh(): Promise<string> {
    if (this.isRefreshing) {
      return new Promise<string>((resolve) => {
        this.refreshSubscribers.push((token: string) => resolve(token));
      });
    }

    this.isRefreshing = true;
    const currentRefreshToken = this.getRefreshToken();

    if (!currentRefreshToken) {
      this.isRefreshing = false;
      this.clearTokens();
      throw new ApiError("No refresh token available", 401);
    }

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: "POST",
        headers: {
          ...API_CONFIG.HEADERS,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ refreshToken: currentRefreshToken }),
      });

      const resData = (await response.json()) as BackendResponse<{
        accessToken: string;
        refreshToken: string;
      }>;

      if (!response.ok || !resData.success || !resData.data?.accessToken) {
        throw new Error(resData.message || "Failed to refresh token.");
      }

      const { accessToken, refreshToken: newRefreshToken } = resData.data;
      this.setTokens({
        accessToken,
        refreshToken: newRefreshToken,
      });

      const subscribers = [...this.refreshSubscribers];
      this.refreshSubscribers = [];
      subscribers.forEach((callback) => callback(accessToken));

      return accessToken;
    } catch (err) {
      this.clearTokens();
      this.refreshSubscribers = [];
      throw err;
    } finally {
      this.isRefreshing = false;
    }
  }

  public async request<T>(endpoint: string, options: RequestOptions = {}): Promise<T> {
    const { params, headers, _retry, responseType, ...restOptions } = options;
    const url = this.buildUrl(endpoint, params);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_CONFIG.TIMEOUT_MS);

    const token = this.getAccessToken();
    const authHeaders: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const response = await fetch(url, {
        headers: {
          ...API_CONFIG.HEADERS,
          ...authHeaders,
          ...headers,
        },
        signal: controller.signal,
        ...restOptions,
      });

      // Handle 401 Unauthorized with Automatic Silent Refresh
      if (
        response.status === 401 &&
        !_retry &&
        !endpoint.includes("/auth/login") &&
        !endpoint.includes("/auth/refresh") &&
        this.getRefreshToken()
      ) {
        clearTimeout(timeoutId);
        try {
          const newAccessToken = await this.performTokenRefresh();
          return this.request<T>(endpoint, {
            ...options,
            _retry: true,
            headers: {
              ...headers,
              Authorization: `Bearer ${newAccessToken}`,
            },
          });
        } catch {
          this.clearTokens();
          throw new ApiError("Session expired. Please sign in again.", 401);
        }
      }

      if (responseType === "blob" && response.ok) return await response.blob() as T;

      const data: BackendResponse<T> = await response.json().catch(() => ({
        success: response.ok,
        statusCode: response.status,
        message: response.statusText,
        data: null as unknown as T,
        timestamp: new Date().toISOString(),
      }));

      if (!response.ok || !data.success) {
        throw new ApiError(
          data.message || `Request failed with status ${response.status}`,
          response.status,
          data.errors
        );
      }

      return data.data;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      if (error instanceof Error && error.name === "AbortError") {
        throw new ApiError("Request timeout exceeded.", 408);
      }
      throw new ApiError(
        error instanceof Error ? error.message : "Failed to connect to backend service.",
        503
      );
    } finally {
      clearTimeout(timeoutId);
    }
  }

  public get<T>(endpoint: string, params?: Record<string, string | number | boolean | undefined>): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", params });
  }

  public post<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public put<T>(endpoint: string, body?: unknown): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  }

  public delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE" });
  }
}

export const apiClient = new ApiClient();
