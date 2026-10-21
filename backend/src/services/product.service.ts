import {
  CreateProductDTO,
  IProductRepository,
  IProductService,
  Product,
  ProductFilterParams,
  UpdateProductDTO,
} from '../types/product.types.js';
import { PaginatedResult } from '../types/common.types.js';
import { productRepository as defaultProductRepository } from '../repositories/product.repository.js';
import { BadRequestError, ConflictError, NotFoundError } from '../utils/appError.js';
import { ResponseMessages } from '../constants/responseMessages.js';
import { AppConstants } from '../constants/app.constants.js';

/**
 * SERVICE LAYER: ProductService
 *
 * Responsibility: ONLY Business Logic, Rules, Calculations, & Domain Validation.
 *
 * STRICT ARCHITECTURAL RULE:
 * - NO direct database operations, SQL, or ORM calls are allowed here.
 * - All persistence actions must be delegated to the repository interface.
 */
export class ProductService implements IProductService {
  private readonly productRepo: IProductRepository;

  constructor(repository: IProductRepository = defaultProductRepository) {
    this.productRepo = repository;
  }

  public async listProducts(filters: ProductFilterParams): Promise<PaginatedResult<Product>> {
    // Business logic: enforce pagination boundaries
    const page = Math.max(1, filters.page || AppConstants.DEFAULT_PAGE);
    const pageSize = Math.min(
      AppConstants.MAX_PAGE_SIZE,
      Math.max(1, filters.pageSize || AppConstants.DEFAULT_PAGE_SIZE)
    );

    const validatedFilters: ProductFilterParams = {
      ...filters,
      page,
      pageSize,
    };

    // Delegate database query to repository layer
    return await this.productRepo.findAll(validatedFilters);
  }

  public async getProductById(id: string): Promise<Product> {
    if (!id || id.trim() === '') {
      throw new BadRequestError('Product ID is required.');
    }

    // Delegate retrieval to repository
    const product = await this.productRepo.findById(id);
    if (!product) {
      throw new NotFoundError(ResponseMessages.PRODUCT_NOT_FOUND);
    }

    return product;
  }

  public async createProduct(dto: CreateProductDTO): Promise<Product> {
    // 1. Business validation
    if (!dto.name || dto.name.trim().length < 3) {
      throw new BadRequestError('Product name must be at least 3 characters long.');
    }

    if (typeof dto.pricePerSqFt !== 'number' || dto.pricePerSqFt <= 0) {
      throw new BadRequestError('Price per sq. ft. must be a positive number.');
    }

    // 2. Business rule: Generate clean slug
    const generatedSlug = this.generateSlug(dto.name);

    // 3. Check business constraint: Slug uniqueness via repository
    const existing = await this.productRepo.findBySlug(generatedSlug);
    if (existing) {
      throw new ConflictError(ResponseMessages.PRODUCT_SLUG_EXISTS);
    }

    // 4. Delegate database insertion to repository
    return await this.productRepo.create({
      name: dto.name.trim(),
      slug: generatedSlug,
      category: dto.category.trim(),
      size: dto.size.trim(),
      finish: dto.finish.trim(),
      pricePerSqFt: dto.pricePerSqFt,
      inStock: dto.inStock ?? true,
      imageUrl: dto.imageUrl,
    });
  }

  public async updateProduct(id: string, dto: UpdateProductDTO): Promise<Product> {
    if (!id || id.trim() === '') {
      throw new BadRequestError('Product ID is required.');
    }

    // 1. Verify existence through repository
    const existing = await this.productRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(ResponseMessages.PRODUCT_NOT_FOUND);
    }

    // 2. Business validation on updates
    if (dto.name && dto.name.trim().length < 3) {
      throw new BadRequestError('Product name must be at least 3 characters long.');
    }

    if (dto.pricePerSqFt !== undefined && (typeof dto.pricePerSqFt !== 'number' || dto.pricePerSqFt <= 0)) {
      throw new BadRequestError('Price per sq. ft. must be a positive number.');
    }

    // 3. Delegate database update to repository
    const updated = await this.productRepo.update(id, dto);
    if (!updated) {
      throw new NotFoundError(ResponseMessages.PRODUCT_NOT_FOUND);
    }

    return updated;
  }

  public async deleteProduct(id: string): Promise<void> {
    if (!id || id.trim() === '') {
      throw new BadRequestError('Product ID is required.');
    }

    // Verify existence
    const existing = await this.productRepo.findById(id);
    if (!existing) {
      throw new NotFoundError(ResponseMessages.PRODUCT_NOT_FOUND);
    }

    // Delegate database deletion to repository
    const deleted = await this.productRepo.delete(id);
    if (!deleted) {
      throw new NotFoundError(ResponseMessages.PRODUCT_NOT_FOUND);
    }
  }

  /**
   * Domain helper method (Pure business logic)
   */
  private generateSlug(text: string): string {
    return text
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }
}

export const productService = new ProductService();
