import { DatabaseSync } from 'node:sqlite';
import type { CatalogueOption } from '../types/catalogue.types.js';

/** Read-only bridge for the original local catalogue. Never changes its source. */
export function readLegacyCatalogue(filename: string) {
  const database = new DatabaseSync(filename, { readOnly: true });
  try {
    const products = database.prepare('SELECT payload FROM products').all()
      .map(row => JSON.parse(String(row.payload)) as Record<string, unknown>);
    const options = database.prepare('SELECT id,category,value,revision FROM design_options').all()
      .map(row => ({ id: String(row.id), group: String(row.category), value: String(row.value), revision: 1 } satisfies CatalogueOption));
    return { products, options };
  } finally { database.close(); }
}
