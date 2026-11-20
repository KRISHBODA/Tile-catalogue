import { randomUUID } from 'node:crypto';
import { catalogueHistoryRepository } from '../repositories/catalogue-history.repository.js';
import type { CatalogueHistoryRecord, CataloguePdfStatus, CreateCatalogueHistoryInput } from '../types/catalogue-history.types.js';
import { BadRequestError, NotFoundError } from '../utils/appError.js';

export class CatalogueHistoryService {
  async list(owner: string) {
    return catalogueHistoryRepository.list(owner);
  }

  async create(owner: string, generatedBy: string, input: CreateCatalogueHistoryInput): Promise<CatalogueHistoryRecord> {
    const name = typeof input?.name === 'string' ? input.name.trim().slice(0, 200) : '';
    if (!name) throw new BadRequestError('Catalogue name is required.');
    if (!input.config || typeof input.config !== 'object' || Array.isArray(input.config)) {
      throw new BadRequestError('Catalogue settings are required.');
    }
    const record: CatalogueHistoryRecord = {
      id: randomUUID(),
      name,
      createdAt: new Date().toISOString(),
      generatedAt: null,
      generatedBy,
      assignedTo: typeof input.assignedTo === 'string' ? input.assignedTo.trim().slice(0, 200) : '',
      pdfSize: null,
      status: 'GENERATING',
      config: input.config,
    };
    return catalogueHistoryRepository.create(owner, record);
  }

  async updateStatus(owner: string, id: string, status: CataloguePdfStatus) {
    if (!['READY', 'FAILED'].includes(status)) throw new BadRequestError('Invalid PDF generation status.');
    const record = await catalogueHistoryRepository.updateStatus(owner, id, status);
    if (!record) throw new NotFoundError('Catalogue history entry not found.');
    return record;
  }

  async remove(owner: string, id: string) {
    if (!(await catalogueHistoryRepository.remove(owner, id))) throw new NotFoundError('Catalogue history entry not found.');
  }
}

export const catalogueHistoryService = new CatalogueHistoryService();
