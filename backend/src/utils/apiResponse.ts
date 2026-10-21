import { Response } from 'express';
import { HttpStatusCode, HttpStatusCodes } from '../constants/httpStatusCodes.js';
import { ApiResponseFormat } from '../types/common.types.js';

export class ApiResponse {
  public static success<T>(
    res: Response,
    data: T,
    message = 'Success',
    statusCode: HttpStatusCode = HttpStatusCodes.OK,
    meta?: Record<string, unknown>
  ): Response {
    const payload: ApiResponseFormat<T> = {
      success: true,
      statusCode,
      message,
      data,
      meta,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(payload);
  }

  public static error(
    res: Response,
    message: string,
    statusCode: HttpStatusCode = HttpStatusCodes.INTERNAL_SERVER_ERROR,
    errors?: unknown
  ): Response {
    const payload: ApiResponseFormat = {
      success: false,
      statusCode,
      message,
      errors,
      timestamp: new Date().toISOString(),
    };
    return res.status(statusCode).json(payload);
  }
}
