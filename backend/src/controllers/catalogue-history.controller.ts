import type { Response, NextFunction } from 'express';
import type { AuthenticatedRequest } from '../middlewares/auth.middleware.js';
import { catalogueHistoryService } from '../services/catalogue-history.service.js';
import type { CataloguePdfStatus, CreateCatalogueHistoryInput } from '../types/catalogue-history.types.js';
import { ApiResponse } from '../utils/apiResponse.js';

export const catalogueHistoryController = {
  async list(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try { ApiResponse.success(res, await catalogueHistoryService.list(req.user!.id)); }
    catch (error) { next(error); }
  },
  async create(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const record = await catalogueHistoryService.create(
        req.user!.id,
        req.user!.email || req.user!.name,
        req.body as CreateCatalogueHistoryInput,
      );
      ApiResponse.success(res, record, 'Catalogue history created.', 201);
    } catch (error) { next(error); }
  },
  async updateStatus(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      ApiResponse.success(res, await catalogueHistoryService.updateStatus(
        req.user!.id,
        String(req.params.id),
        req.body.status as CataloguePdfStatus,
      ));
    } catch (error) { next(error); }
  },
  async remove(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      await catalogueHistoryService.remove(req.user!.id, String(req.params.id));
      ApiResponse.success(res, { deleted: true });
    } catch (error) { next(error); }
  },
};
