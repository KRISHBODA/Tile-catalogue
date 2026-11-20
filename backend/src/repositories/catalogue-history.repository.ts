import { prisma } from '../config/database.js';
import type { CatalogueHistoryRecord, CataloguePdfStatus } from '../types/catalogue-history.types.js';

let setup: Promise<void> | undefined;
async function ready() {
  if (!setup) setup = (async () => {
    await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS catalogue_pdf_history (
      owner TEXT NOT NULL,
      id TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL,
      payload JSONB NOT NULL,
      PRIMARY KEY(owner, id)
    )`);
    await prisma.$executeRawUnsafe('CREATE INDEX IF NOT EXISTS catalogue_pdf_history_created_idx ON catalogue_pdf_history(owner, created_at DESC)');
  })().catch((error) => { setup = undefined; throw error; });
  await setup;
}

export class CatalogueHistoryRepository {
  async list(owner: string): Promise<CatalogueHistoryRecord[]> {
    await ready();
    const rows = await prisma.$queryRaw<{ payload: CatalogueHistoryRecord }[]>`
      SELECT payload FROM catalogue_pdf_history WHERE owner=${owner} ORDER BY created_at DESC
    `;
    return rows.map((row) => row.payload);
  }

  async create(owner: string, record: CatalogueHistoryRecord): Promise<CatalogueHistoryRecord> {
    await ready();
    await prisma.$executeRaw`
      INSERT INTO catalogue_pdf_history(owner, id, created_at, payload)
      VALUES(${owner}, ${record.id}, ${new Date(record.createdAt)}, ${JSON.stringify(record)}::jsonb)
    `;
    return record;
  }

  async updateStatus(owner: string, id: string, status: CataloguePdfStatus): Promise<CatalogueHistoryRecord | null> {
    await ready();
    const generatedAt = status === 'READY' ? new Date().toISOString() : null;
    const patch = JSON.stringify({ status, generatedAt });
    const rows = await prisma.$queryRaw<{ payload: CatalogueHistoryRecord }[]>`
      UPDATE catalogue_pdf_history
      SET payload = payload || ${patch}::jsonb
      WHERE owner=${owner} AND id=${id}
      RETURNING payload
    `;
    return rows[0]?.payload ?? null;
  }

  async remove(owner: string, id: string): Promise<boolean> {
    await ready();
    const count = await prisma.$executeRaw`DELETE FROM catalogue_pdf_history WHERE owner=${owner} AND id=${id}`;
    return count === 1;
  }
}

export const catalogueHistoryRepository = new CatalogueHistoryRepository();
