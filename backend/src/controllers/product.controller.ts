import { Request, Response, NextFunction } from 'express';
import { IProductService, ProductFilterParams } from '../types/product.types.js';
import { productService as defaultProductService } from '../services/product.service.js';
import { ApiResponse } from '../utils/apiResponse.js';
import { HttpStatusCodes } from '../constants/httpStatusCodes.js';
import { ResponseMessages } from '../constants/responseMessages.js';
import { AppConstants } from '../constants/app.constants.js';

/**
 * CONTROLLER LAYER: ProductController
 *
 * Responsibility: ONLY Request & Response orchestration.
 *
 * Rules:
 * - Extracts HTTP request query, headers, params, and body.
 * - Delegates execution to the Service layer.
 * - Formats and returns standardized HTTP response.
 * - Passes errors to the next middleware.
 * - NEVER touches database or persistence logic directly.
 */
export class ProductController {
  private readonly service: IProductService;

  constructor(service: IProductService = defaultProductService) {
    this.service = service;
  }

  public getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const filters: ProductFilterParams = {
        page: req.query.page ? parseInt(req.query.page as string, 10) : AppConstants.DEFAULT_PAGE,
        pageSize: req.query.pageSize
          ? parseInt(req.query.pageSize as string, 10)
          : AppConstants.DEFAULT_PAGE_SIZE,
        category: req.query.category as string | undefined,
        finish: req.query.finish as string | undefined,
        inStock:
          req.query.inStock !== undefined
            ? req.query.inStock === 'true' || req.query.inStock === '1'
            : undefined,
        search: req.query.search as string | undefined,
        sortBy: (req.query.sortBy as string) || AppConstants.DEFAULT_SORT_BY,
        sortOrder: req.query.sortOrder === 'asc' ? 'asc' : 'desc',
      };

      const result = await this.service.listProducts(filters);

      ApiResponse.success(
        res,
        result.items,
        ResponseMessages.SUCCESS,
        HttpStatusCodes.OK,
        {
          total: result.total,
          page: result.page,
          pageSize: result.pageSize,
          totalPages: result.totalPages,
          hasNextPage: result.hasNextPage,
          hasPrevPage: result.hasPrevPage,
        }
      );
    } catch (error) {
      next(error);
    }
  };

  public getProductById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const product = await this.service.getProductById(id);
      ApiResponse.success(res, product, ResponseMessages.SUCCESS, HttpStatusCodes.OK);
    } catch (error) {
      next(error);
    }
  };

  public createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const created = await this.service.createProduct(req.body);
      ApiResponse.success(res, created, ResponseMessages.CREATED, HttpStatusCodes.CREATED);
    } catch (error) {
      next(error);
    }
  };

  public updateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      const updated = await this.service.updateProduct(id, req.body);
      ApiResponse.success(res, updated, ResponseMessages.UPDATED, HttpStatusCodes.OK);
    } catch (error) {
      next(error);
    }
  };

  public deleteProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const id = String(req.params.id);
      await this.service.deleteProduct(id);
      ApiResponse.success(res, null, ResponseMessages.DELETED, HttpStatusCodes.OK);
    } catch (error) {
      next(error);
    }
  };
}

export const productController = new ProductController();
