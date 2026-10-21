import { ErrorRequestHandler } from 'express';
import { AppError } from '../utils/appError.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HttpStatusCodes } from '../constants/httpStatusCodes.js';
import { ResponseMessages } from '../constants/responseMessages.js';
import { env } from '../config/env.js';

export const errorHandler: ErrorRequestHandler = (err, req, res, _next) => {
  const isDevelopment = env.NODE_ENV === 'development';

  if (err instanceof AppError) {
    if (isDevelopment && !err.isOperational) {
      console.error('[Error] Non-operational AppError:', err);
    }

    ApiResponse.error(
      res,
      err.message,
      err.statusCode,
      err.errors || (isDevelopment ? { stack: err.stack } : undefined)
    );
    return;
  }

  // Handle unhandled unexpected errors
  console.error('[Unhandled Error]:', err);

  ApiResponse.error(
    res,
    ResponseMessages.INTERNAL_ERROR,
    HttpStatusCodes.INTERNAL_SERVER_ERROR,
    isDevelopment ? { message: err?.message, stack: err?.stack } : undefined
  );
};
