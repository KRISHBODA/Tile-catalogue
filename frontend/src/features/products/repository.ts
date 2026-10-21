import { DatabaseSync } from "node:sqlite";
import { mkdirSync, existsSync } from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { sampleProducts } from "./sample-data.ts";
import {
  ProductError,
  validateProduct,
  validateBulk,
  validateTargets,
} from "./validation.ts";
import type { Product, ProductDraft } from "./types.ts";
export function dataDirectory() {
  return process.env.TILE_DATA_DIR || path.join(process.cwd(), "data");
}
// Each operation owns a connection. SQLite transactions protect writes across tabs/processes.
function withDatabase<T>(run: (db: DatabaseSync) => T): T {
  mkdirSync(dataDirectory(), { recursive: true });
  const db = new DatabaseSync(path.join(dataDirectory(), "catalogue.sqlite"));
  try {
    db.exec(
      "PRAGMA busy_timeout=5000; PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, code TEXT UNIQUE NOT NULL, payload TEXT NOT NULL); CREATE TABLE IF NOT EXISTS metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);",
    );
    db.exec("BEGIN IMMEDIATE");
    if (!db.prepare("SELECT value FROM metadata WHERE key='seeded'").get()) {
      const insert = db.prepare(
        "INSERT INTO products(id,code,payload) VALUES(?,?,?)",
      );
      for (const p of sampleProducts)
        insert.run(p.id, p.code.toLowerCase(), JSON.stringify(p));
      db.prepare("INSERT INTO metadata(key,value) VALUES(?,?)").run(
        "seeded",
        "1",
      );
    }
    db.exec("COMMIT");
    return run(db);
  } finally {
    db.close();
  }
}
function all(db: DatabaseSync): Product[] {
  return db
    .prepare("SELECT payload FROM products ORDER BY code")
    .all()
    .map((row) => ({ has360: false, ...JSON.parse(row.payload as string) } as Product));
}
function get(db: DatabaseSync, id: string): Product {
  const row = db.prepare("SELECT payload FROM products WHERE id=?").get(id);
  if (!row)
    throw new ProductError(
      "This product no longer exists. Refresh the library.",
      404,
    );
  return { has360: false, ...JSON.parse(row.payload as string) } as Product;
}
function transaction<T>(db: DatabaseSync, run: () => T): T {
  db.exec("BEGIN IMMEDIATE");
  try {
    const result = run();
    db.exec("COMMIT");
    return result;
  } catch (e) {
    db.exec("ROLLBACK");
    throw e;
  }
}
function verifyAssets(product: ProductDraft) {
  for (const a of [...product.faces, ...product.media]) {
    if (
      a.previewUrl.startsWith("/api/media/") &&
      !existsSync(
        path.join(dataDirectory(), "media", path.basename(a.previewUrl)),
      )
    )
      throw new ProductError(
        "An uploaded image is missing. Please upload it again.",
      );
  }
}
function write(db: DatabaseSync, p: Product) {
  const duplicate = db
    .prepare("SELECT id FROM products WHERE code=? AND id<>?")
    .get(p.code.toLowerCase(), p.id);
  if (duplicate)
    throw new ProductError(
      "That design code is already in use. Choose a unique code.",
      409,
    );
  db.prepare(
    "INSERT INTO products(id,code,payload) VALUES(?,?,?) ON CONFLICT(id) DO UPDATE SET code=excluded.code,payload=excluded.payload",
  ).run(p.id, p.code.toLowerCase(), JSON.stringify(p));
}
export async function listProducts(): Promise<Product[]> {
  return withDatabase(all);
}
export async function saveProduct(
  input: unknown,
  target?: unknown,
): Promise<Product> {
  const draft = validateProduct(input);
  verifyAssets(draft);
  const expected =
    target === undefined ? undefined : validateTargets([target])[0];
  return withDatabase((db) =>
    transaction(db, () => {
      const previous = expected ? get(db, expected.id) : undefined;
      if (previous && previous.revision !== expected!.revision)
        throw new ProductError(
          "This product changed in another tab. Close the editor, refresh the library and try again.",
          409,
        );
      const product: Product = {
        ...draft,
        id: previous?.id || randomUUID(),
        revision: (previous?.revision || 0) + 1,
        isSample: previous?.isSample || false,
        updatedAt: new Date().toISOString(),
      };
      write(db, product);
      return product;
    }),
  );
}
export async function duplicateProduct(target: unknown): Promise<Product> {
  const expected = validateTargets([target])[0];
  return withDatabase((db) =>
    transaction(db, () => {
      const original = get(db, expected.id);
      if (original.revision !== expected.revision)
        throw new ProductError(
          "This product changed. Refresh the library before duplicating.",
          409,
        );
      let code = original.code.slice(0, 48) + "-COPY";
      let n = 2;
      while (
        db
          .prepare("SELECT id FROM products WHERE code=?")
          .get(code.toLowerCase())
      )
        code = original.code.slice(0, 48) + `-COPY-${n++}`;
      const product: Product = {
        ...original,
        id: randomUUID(),
        name: (original.name + " — Copy").slice(0, 120),
        code,
        status: "Draft",
        revision: 1,
        showInPdf: false,
        updatedAt: new Date().toISOString(),
      };
      write(db, product);
      return product;
    }),
  );
}
export async function bulkUpdate(
  targets: unknown,
  changes: unknown,
): Promise<Product[]> {
  const expected = validateTargets(targets),
    patch = validateBulk(changes);
  return withDatabase((db) =>
    transaction(db, () => {
      const products = expected.map((t) => {
        const p = get(db, t.id);
        if (p.revision !== t.revision)
          throw new ProductError(
            "A selected product changed in another tab. Refresh and select the products again.",
            409,
          );
        return {
          ...p,
          ...patch,
          revision: p.revision + 1,
          updatedAt: new Date().toISOString(),
        };
      });
      products.forEach((p) => write(db, p));
      return products;
    }),
  );
}
