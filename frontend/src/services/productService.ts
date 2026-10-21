import { apiClient } from "./apiClient";
import { API_ENDPOINTS } from "../constants/api.constants";

export interface BackendProduct {
  id: string;
  name: string;
  slug: string;
  category: string;
  size: string;
  finish: string;
  pricePerSqFt: number;
  inStock: boolean;
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProductFilters {
  page?: number;
  pageSize?: number;
  category?: string;
  finish?: string;
  inStock?: boolean;
  search?: string;
  sortBy?: string;
  sortOrder?: "asc" | "desc";
}

export interface CreateProductInput {
  name: string;
  category: string;
  size: string;
  finish: string;
  pricePerSqFt: number;
  inStock?: boolean;
  imageUrl?: string;
}

export interface UpdateProductInput {
  name?: string;
  category?: string;
  size?: string;
  finish?: string;
  pricePerSqFt?: number;
  inStock?: boolean;
  imageUrl?: string;
}

export const productService = {
  /**
   * Get paginated products list from backend
   */
  async getProducts(filters?: ProductFilters): Promise<BackendProduct[]> {
    return apiClient.get<BackendProduct[]>(
      API_ENDPOINTS.PRODUCTS.BASE,
      filters as Record<string, string | number | boolean | undefined>
    );
  },

  /**
   * Get single product by ID
   */
  async getProductById(id: string): Promise<BackendProduct> {
    return apiClient.get<BackendProduct>(API_ENDPOINTS.PRODUCTS.BY_ID(id));
  },

  /**
   * Create new product
   */
  async createProduct(input: CreateProductInput): Promise<BackendProduct> {
    return apiClient.post<BackendProduct>(API_ENDPOINTS.PRODUCTS.BASE, input);
  },

  /**
   * Update existing product
   */
  async updateProduct(id: string, input: UpdateProductInput): Promise<BackendProduct> {
    return apiClient.put<BackendProduct>(API_ENDPOINTS.PRODUCTS.BY_ID(id), input);
  },

  /**
   * Delete product by ID
   */
  async deleteProduct(id: string): Promise<void> {
    return apiClient.delete<void>(API_ENDPOINTS.PRODUCTS.BY_ID(id));
  },
};
