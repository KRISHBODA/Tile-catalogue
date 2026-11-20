export type CataloguePdfStatus = 'GENERATING' | 'READY' | 'FAILED';

export interface CatalogueHistoryRecord {
  id: string;
  name: string;
  createdAt: string;
  generatedAt: string | null;
  generatedBy: string;
  assignedTo: string;
  pdfSize: string | null;
  status: CataloguePdfStatus;
  config: Record<string, unknown>;
}

export interface CreateCatalogueHistoryInput {
  name: string;
  assignedTo?: string;
  config: Record<string, unknown>;
}
