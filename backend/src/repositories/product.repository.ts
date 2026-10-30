import { IProductRepository, Product, ProductFilterParams } from '../types/product.types.js';
import { PaginatedResult } from '../types/common.types.js';
import { prisma } from '../config/database.js';
import { Prisma } from '@prisma/client';

/**
 * REPOSITORY LAYER: ProductRepository
 *
 * Responsibility: ONLY Database / Persistence Operations via Prisma ORM.
 *
 * Rules:
 * - NO business logic or validation rules here.
 * - Executes direct Prisma queries against PostgreSQL.
 * - Implements IProductRepository to ensure a clean contract.
 */
export class ProductRepository implements IProductRepository {
  public async findAll(filters: ProductFilterParams): Promise<PaginatedResult<Product>> {
    const where: Prisma.ProductWhereInput = {};

    if (filters.category) {
      where.category = { equals: filters.category, mode: 'insensitive' };
    }

    if (filters.finish) {
      where.finish = { equals: filters.finish, mode: 'insensitive' };
    }

    if (typeof filters.inStock === 'boolean') {
      where.inStock = filters.inStock;
    }

    if (filters.search) {
      const q = filters.search.trim();
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { category: { contains: q, mode: 'insensitive' } },
        { finish: { contains: q, mode: 'insensitive' } },
      ];
    }

    const skip = (filters.page - 1) * filters.pageSize;
    const take = filters.pageSize;

    const [total, items] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take,
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    const totalPages = Math.ceil(total / filters.pageSize) || 1;

    return {
      items: items.map(this.mapPrismaProduct),
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages,
      hasNextPage: filters.page < totalPages,
      hasPrevPage: filters.page > 1,
    };
  }

  public async findById(id: string): Promise<Product | null> {
    const item = await prisma.product.findUnique({
      where: { id },
    });
    return item ? this.mapPrismaProduct(item) : null;
  }

  public async findBySlug(slug: string): Promise<Product | null> {
    const item = await prisma.product.findUnique({
      where: { slug },
    });
    return item ? this.mapPrismaProduct(item) : null;
  }

  public async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    const created = await prisma.product.create({
      data: {
        name: productData.name,
        slug: productData.slug,
        category: productData.category,
        size: productData.size,
        finish: productData.finish,
        pricePerSqFt: productData.pricePerSqFt,
        inStock: productData.inStock ?? true,
        imageUrl: productData.imageUrl ?? null,
      },
    });
    return this.mapPrismaProduct(created);
  }

  public async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    try {
      const updated = await prisma.product.update({
        where: { id },
        data: {
          ...(updates.name !== undefined && { name: updates.name }),
          ...(updates.slug !== undefined && { slug: updates.slug }),
          ...(updates.category !== undefined && { category: updates.category }),
          ...(updates.size !== undefined && { size: updates.size }),
          ...(updates.finish !== undefined && { finish: updates.finish }),
          ...(updates.pricePerSqFt !== undefined && { pricePerSqFt: updates.pricePerSqFt }),
          ...(updates.inStock !== undefined && { inStock: updates.inStock }),
          ...(updates.imageUrl !== undefined && { imageUrl: updates.imageUrl }),
        },
      });
      return this.mapPrismaProduct(updated);
    } catch {
      return null;
    }
  }

  public async delete(id: string): Promise<boolean> {
    try {
      await prisma.product.delete({
        where: { id },
      });
      return true;
    } catch {
      return false;
    }
  }

  private mapPrismaProduct(row: {
    id: string;
    name: string;
    slug: string;
    category: string;
    size: string;
    finish: string;
    pricePerSqFt: number;
    inStock: boolean;
    imageUrl: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Product {
    return {
      ...row,
      imageUrl: row.imageUrl ?? undefined,
    };
  }
}

export const productRepository = new ProductRepository();
