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
