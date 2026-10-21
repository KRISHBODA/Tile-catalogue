import { PaginatedResult, PaginationParams } from './common.types.js';

export interface Product {
  id: string;
  name: string;
  slug: string;
  category: string;
  size: string;
  finish: string;
  pricePerSqFt: number;
  inStock: boolean;
  imageUrl?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductDTO {
  name: string;
  category: string;
  size: string;
  finish: string;
  pricePerSqFt: number;
  inStock?: boolean;
  imageUrl?: string;
}

export interface UpdateProductDTO {
  name?: string;
  category?: string;
  size?: string;
  finish?: string;
  pricePerSqFt?: number;
  inStock?: boolean;
  imageUrl?: string;
}

export interface ProductFilterParams extends PaginationParams {
  category?: string;
  finish?: string;
  inStock?: boolean;
  search?: string;
}

/**
 * REPOSITORY INTERFACE (Data Access Layer Contract)
 * Strictly responsible for interacting with the database/persistence layer.
 */
export interface IProductRepository {
  findAll(filters: ProductFilterParams): Promise<PaginatedResult<Product>>;
  findById(id: string): Promise<Product | null>;
  findBySlug(slug: string): Promise<Product | null>;
  create(product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product>;
  update(id: string, product: Partial<Product>): Promise<Product | null>;
  delete(id: string): Promise<boolean>;
}

/**
 * SERVICE INTERFACE (Business Logic Layer Contract)
 * Strictly responsible for business logic, validation, rules, and orchestrating repositories.
 * MUST NOT contain database queries or direct DB manipulation.
 */
export interface IProductService {
  listProducts(filters: ProductFilterParams): Promise<PaginatedResult<Product>>;
  getProductById(id: string): Promise<Product>;
  createProduct(dto: CreateProductDTO): Promise<Product>;
  updateProduct(id: string, dto: UpdateProductDTO): Promise<Product>;
  deleteProduct(id: string): Promise<void>;
}
