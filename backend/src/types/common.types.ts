import { HttpStatusCode } from '../constants/httpStatusCodes.js';

export interface PaginationParams {
  page: number;
  pageSize: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

export interface ApiResponseFormat<T = unknown> {
  success: boolean;
  statusCode: HttpStatusCode;
  message: string;
  data?: T;
  meta?: Record<string, unknown>;
  errors?: unknown;
  timestamp: string;
}
