import { Request, Response, NextFunction } from 'express';
import { NotFoundError } from '../utils/appError.js';
import { ResponseMessages } from '../constants/responseMessages.js';

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
  next(new NotFoundError(`${ResponseMessages.ROUTE_NOT_FOUND}: [${req.method}] ${req.originalUrl}`));
};
