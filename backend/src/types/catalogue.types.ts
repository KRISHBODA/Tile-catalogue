export const mediaRoles = ['tile-face','preview','live-image','live-video','360','channel','closeup','social-image','social-video','3d'] as const;
export type MediaRole = typeof mediaRoles[number];
export interface CatalogueMedia { id: string; role: MediaRole; name: string; }
export interface CatalogueDesign {
  id: string; revision: number; createdAt: string; updatedAt: string; uploadedBy: string;
  name: string; code: string; size: string; collection: string; surface: string; body: string; thickness: string;
  extraName: string; alternateName: string; bodyDetails: string; tags: string; colours: string; group: string; description: string;
  availableSize: string; availableCollection: string; availableSurface: string; availableBody: string; availableThickness: string;
  hsnCode: string; url360: string; status: string; showInPdf: boolean; private: boolean; has360: boolean;
  bookmatch: boolean; border: boolean; borderShadow: boolean; background: boolean; inDisplay: boolean;
  media: CatalogueMedia[]; variants: {size:string;surface:string;body:string;thickness:string}[];
  deletedAt?: string | null;
}
export interface CatalogueOption { id: string; group: string; value: string; revision: number; }
export interface ICatalogueRepository {
  list(owner: string): Promise<CatalogueDesign[]>;
  save(owner: string, designs: CatalogueDesign[], expected: number[]): Promise<CatalogueDesign[]>;
  initializeOptions(owner: string, options: CatalogueOption[]): Promise<void>;
  options(owner: string): Promise<CatalogueOption[]>;
  saveOption(owner: string, option: CatalogueOption, expected: number): Promise<CatalogueOption[]>;
  removeOption(owner: string, id: string, revision: number): Promise<CatalogueOption[]>;
  putMedia(owner: string, id: string, bytes: Buffer): Promise<void>;
  readMedia(owner: string, id: string): Promise<Buffer>;
  mediaSize(owner: string, id: string): Promise<number>;
  mediaPart(owner: string, id: string, offset: number, length: number): Promise<Buffer>;
  putUploadPart(owner: string, upload: string, index: number, bytes: Buffer): Promise<void>;
  readUploadParts(owner: string, upload: string): Promise<{index: number; bytes: Buffer}[]>;
  clearUploadParts(owner: string, upload: string): Promise<void>;
}
