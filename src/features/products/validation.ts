import type {
  BulkChanges,
  MediaAsset,
  ProductDraft,
  ProductTarget,
  TechnicalVariant,
} from "./types.ts";
export class ProductError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}
const fail = (message: string): never => {
  throw new ProductError(message);
};
function object(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    return fail("Invalid product data.");
  return value as Record<string, unknown>;
}
function text(
  value: unknown,
  label: string,
  max = 120,
  required = true,
): string {
  if (typeof value !== "string") return fail(`${label} must be text.`);
  const s = value.trim();
  if ((required && !s) || s.length > max)
    return fail(
      `${label} ${!s ? "is required" : `must be ${max} characters or fewer`}.`,
    );
  return s;
}
function number(value: unknown, label: string, max: number): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value <= 0 ||
    value > max
  )
    return fail(`${label} must be between 0 and ${max}.`);
  return value;
}
function bool(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") return fail(`${label} must be yes or no.`);
  return value;
}
function list(value: unknown, label: string): string[] {
  if (!Array.isArray(value) || value.length > 20)
    return fail(`${label} supports up to 20 values.`);
  return [...new Set(value.map((v) => text(v, label, 50)))];
}
function choice<T extends string>(
  value: unknown,
  options: readonly T[],
  label: string,
): T {
  if (typeof value !== "string" || !options.includes(value as T))
    return fail(`Choose a valid ${label}.`);
  return value as T;
}
const assetPath =
  /^(?:\/samples\/tile-[0-5]\.svg|\/api\/media\/[a-f0-9-]{36}\.(?:png|jpg|webp))$/;
function media(value: unknown, face: boolean): MediaAsset[] {
  if (!Array.isArray(value) || value.length > 30)
    return fail("Use up to 30 images per media group.");
  const result = value.map((item) => {
    const a = object(item);
    const role = choice(
      a.role,
      face ? (["tile-face"] as const) : (["room-preview", "closeup"] as const),
      "media role",
    );
    const previewUrl = text(a.previewUrl, "Image path", 200);
    if (!assetPath.test(previewUrl))
      return fail("Use a bundled sample or an uploaded image.");
    const originalUrl =
      a.originalUrl === null
        ? null
        : text(a.originalUrl, "Original image path", 200);
    if (
      originalUrl !== null &&
      (!assetPath.test(originalUrl) || originalUrl !== previewUrl)
    )
      return fail("Invalid original image path.");
    return {
      id: text(a.id, "Image identifier", 100),
      role,
      previewUrl,
      originalUrl,
      alt: text(a.alt, "Image description", 200),
    };
  });
  if (new Set(result.map((a) => a.id)).size !== result.length)
    return fail("Image identifiers must be unique.");
  return result;
}
export function validateProduct(value: unknown): ProductDraft {
  const p = object(value);
  if (
    !Array.isArray(p.variants) ||
    p.variants.length < 1 ||
    p.variants.length > 20
  )
    return fail("Add between 1 and 20 technical variants.");
  const variants: TechnicalVariant[] = p.variants.map((item) => {
    const v = object(item);
    return {
      id: text(v.id, "Variant identifier", 100),
      widthMm: number(v.widthMm, "Width", 10000),
      heightMm: number(v.heightMm, "Height", 10000),
      thicknessMm: number(v.thicknessMm, "Thickness", 100),
      surface: choice(v.surface, ["Matt", "Polished", "Satin"], "surface"),
      body: choice(v.body, ["Porcelain", "Ceramic", "Full body"], "body"),
    };
  });
  if (new Set(variants.map((v) => v.id)).size !== variants.length)
    return fail("Variant identifiers must be unique.");
  const keys = variants.map(
    (v) => `${v.widthMm}/${v.heightMm}/${v.thicknessMm}/${v.surface}/${v.body}`,
  );
  if (new Set(keys).size !== keys.length)
    return fail("Two variants have identical specifications.");
  return {
    name: text(p.name, "Design name"),
    code: text(p.code, "Design code", 60),
    collection: text(p.collection, "Collection", 80),
    description: text(p.description, "Description", 3000, false),
    tags: list(p.tags, "Tags"),
    colours: list(p.colours, "Colours"),
    status: choice(
      p.status,
      ["Active", "Draft", "Archived"] as const,
      "status",
    ),
    showInPdf: bool(p.showInPdf, "Show in PDF"),
    private: bool(p.private, "Private"),
    variants,
    faces: media(p.faces, true),
    media: media(p.media, false),
  };
}
export function validateTargets(value: unknown): ProductTarget[] {
  if (!Array.isArray(value) || !value.length || value.length > 100)
    return fail("Select between 1 and 100 products.");
  const targets = value.map((item) => {
    const p = object(item);
    const revision = number(p.revision, "Revision", Number.MAX_SAFE_INTEGER);
    if (!Number.isInteger(revision)) return fail("Invalid revision.");
    return { id: text(p.id, "Product identifier", 100), revision };
  });
  if (new Set(targets.map((p) => p.id)).size !== targets.length)
    return fail("Duplicate product selection.");
  return targets;
}
export function validateBulk(value: unknown): BulkChanges {
  const p = object(value);
  if (
    Object.keys(p).some((k) => !["status", "private", "showInPdf"].includes(k))
  )
    return fail("Unsupported bulk change.");
  const result: BulkChanges = {};
  if (p.status !== undefined)
    result.status = choice(
      p.status,
      ["Active", "Draft", "Archived"] as const,
      "status",
    );
  if (p.private !== undefined) result.private = bool(p.private, "Private");
  if (p.showInPdf !== undefined)
    result.showInPdf = bool(p.showInPdf, "Show in PDF");
  if (!Object.keys(result).length) return fail("Choose at least one change.");
  return result;
}
