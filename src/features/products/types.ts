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
  body: "Porcelain";
}
export interface Product {
  id: string;
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
