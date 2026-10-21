import { Request, Response } from 'express';
import { ApiResponse } from '../utils/apiResponse.js';
import { HttpStatusCodes } from '../constants/httpStatusCodes.js';
import { env } from '../config/env.js';

export class HealthController {
  public check = (_req: Request, res: Response): void => {
    ApiResponse.success(
      res,
      {
        status: 'UP',
        environment: env.NODE_ENV,
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
      },
      'Backend service is running smoothly.',
      HttpStatusCodes.OK
    );
  };
}

export const healthController = new HealthController();
