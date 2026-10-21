import { apiClient } from "./apiClient";
import { API_ENDPOINTS } from "../constants/api.constants";

export interface HealthStatus {
  status: string;
  environment: string;
  uptime: number;
  timestamp: string;
}

export const healthService = {
  async checkHealth(): Promise<HealthStatus> {
    return apiClient.get<HealthStatus>(API_ENDPOINTS.HEALTH);
  },
};
