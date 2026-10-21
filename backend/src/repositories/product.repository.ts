import { IProductRepository, Product, ProductFilterParams } from '../types/product.types.js';
import { PaginatedResult } from '../types/common.types.js';
import { db } from '../config/database.js';

/**
 * REPOSITORY LAYER: ProductRepository
 *
 * Responsibility: ONLY Database / Persistence Operations.
 *
 * Rules:
 * - NO business logic or validation rules here.
 * - Executes direct DB queries (e.g. SQL, ORM, Document DB).
 * - Implements IProductRepository to ensure a clean contract.
 */
export class ProductRepository implements IProductRepository {
  // In-memory persistent store representation (easily replaced with db.query or ORM calls)
  private products: Product[] = [
    {
      id: 'prod-001',
      name: 'Statuario White Gloss Marble Tile',
      slug: 'statuario-white-gloss-marble-tile',
      category: 'Marble',
      size: '600x1200 mm',
      finish: 'Glossy',
      pricePerSqFt: 85,
      inStock: true,
      imageUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c',
      createdAt: new Date('2026-01-10T10:00:00Z'),
      updatedAt: new Date('2026-01-10T10:00:00Z'),
    },
    {
      id: 'prod-002',
      name: 'Rustic Slate Outdoor Paver',
      slug: 'rustic-slate-outdoor-paver',
      category: 'Outdoor',
      size: '600x600 mm',
      finish: 'Matte',
      pricePerSqFt: 62,
      inStock: true,
      imageUrl: 'https://images.unsplash.com/photo-1595846519845-68e298c2edd8',
      createdAt: new Date('2026-01-12T11:00:00Z'),
      updatedAt: new Date('2026-01-12T11:00:00Z'),
    },
    {
      id: 'prod-003',
      name: 'Travertine Beige Polished Porcelain',
      slug: 'travertine-beige-polished-porcelain',
      category: 'Porcelain',
      size: '800x1600 mm',
      finish: 'Polished',
      pricePerSqFt: 110,
      inStock: false,
      imageUrl: 'https://images.unsplash.com/photo-1600565193348-f74bd3c7ccdf',
      createdAt: new Date('2026-01-15T09:30:00Z'),
      updatedAt: new Date('2026-01-15T09:30:00Z'),
    },
  ];

  public async findAll(filters: ProductFilterParams): Promise<PaginatedResult<Product>> {
    // In production: const rows = await db.query('SELECT ...') or await prisma.product.findMany(...)
    let filtered = [...this.products];

    if (filters.category) {
      const cat = filters.category.toLowerCase();
      filtered = filtered.filter((p) => p.category.toLowerCase() === cat);
    }

    if (filters.finish) {
      const fin = filters.finish.toLowerCase();
      filtered = filtered.filter((p) => p.finish.toLowerCase() === fin);
    }

    if (typeof filters.inStock === 'boolean') {
      filtered = filtered.filter((p) => p.inStock === filters.inStock);
    }

    if (filters.search) {
      const query = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(query) ||
          p.category.toLowerCase().includes(query) ||
          p.finish.toLowerCase().includes(query)
      );
    }

    const total = filtered.length;
    const startIndex = (filters.page - 1) * filters.pageSize;
    const items = filtered.slice(startIndex, startIndex + filters.pageSize);
    const totalPages = Math.ceil(total / filters.pageSize) || 1;

    return {
      items,
      total,
      page: filters.page,
      pageSize: filters.pageSize,
      totalPages,
      hasNextPage: filters.page < totalPages,
      hasPrevPage: filters.page > 1,
    };
  }

  public async findById(id: string): Promise<Product | null> {
    // Direct DB query: e.g., SELECT * FROM products WHERE id = $1
    const product = this.products.find((p) => p.id === id);
    return product ? { ...product } : null;
  }

  public async findBySlug(slug: string): Promise<Product | null> {
    // Direct DB query: e.g., SELECT * FROM products WHERE slug = $1
    const product = this.products.find((p) => p.slug === slug);
    return product ? { ...product } : null;
  }

  public async create(productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Promise<Product> {
    // Direct DB insert: e.g., INSERT INTO products (...) VALUES (...)
    const now = new Date();
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now().toString(36)}`,
      createdAt: now,
      updatedAt: now,
    };

    this.products.unshift(newProduct);
    return { ...newProduct };
  }

  public async update(id: string, updates: Partial<Product>): Promise<Product | null> {
    // Direct DB update: e.g., UPDATE products SET ... WHERE id = $1
    const index = this.products.findIndex((p) => p.id === id);
    if (index === -1) return null;

    const existing = this.products[index];
    if (!existing) return null;

    const updated: Product = {
      ...existing,
      ...updates,
      updatedAt: new Date(),
    };

    this.products[index] = updated;
    return { ...updated };
  }

  public async delete(id: string): Promise<boolean> {
    // Direct DB delete: e.g., DELETE FROM products WHERE id = $1
    const initialLength = this.products.length;
    this.products = this.products.filter((p) => p.id !== id);
    return this.products.length < initialLength;
  }
}

export const productRepository = new ProductRepository();
