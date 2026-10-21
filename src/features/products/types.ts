export type ProductStatus = "Active" | "Draft" | "Archived";
export type MediaRole = "tile-face" | "room-preview" | "closeup";
export interface MediaAsset {
  id: string;
  role: MediaRole;
  previewUrl: string;
  originalUrl: string | null;
  alt: string;
}
export interface TechnicalVariant {
  id: string;
  widthMm: number;
  heightMm: number;
  thicknessMm: number;
  surface: "Matt" | "Polished" | "Satin";
  body: "Porcelain" | "Ceramic" | "Full body";
}
export interface Product {
  id: string;
  revision: number;
  updatedAt: string;
  isSample: boolean;
  description: string;
  tags: string[];
  colours: string[];
  name: string;
  code: string;
  collection: string;
  status: ProductStatus;
  showInPdf: boolean;
  private: boolean;
  variants: TechnicalVariant[];
  faces: MediaAsset[];
  media: MediaAsset[];
}
export const sizeLabel = (v: TechnicalVariant) =>
  `${v.widthMm} × ${v.heightMm}`;

export type ProductDraft = Omit<
  Product,
  "id" | "revision" | "updatedAt" | "isSample"
>;
export type BulkChanges = Partial<
  Pick<Product, "status" | "showInPdf" | "private">
>;
export interface ProductTarget {
  id: string;
  revision: number;
}
