import type {
  BulkChanges,
  MediaAsset,
  ProductDraft,
  ProductTarget,
  TechnicalVariant,
} from "../types";

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
    return fail(`${label} must be one of: ${options.join(", ")}.`);
  return value as T;
}

function variant(v: unknown, i: number): TechnicalVariant {
  const o = object(v);
  return {
    id: typeof o.id === "string" && o.id ? o.id : crypto.randomUUID(),
    widthMm: number(o.widthMm, `Variant ${i + 1} width`, 10000),
    heightMm: number(o.heightMm, `Variant ${i + 1} height`, 10000),
    thicknessMm: number(o.thicknessMm, `Variant ${i + 1} thickness`, 100),
    surface: choice(
      o.surface,
      ["Matt", "Polished", "Satin"] as const,
      `Variant ${i + 1} surface`,
    ),
    body: choice(
      o.body,
      ["Porcelain", "Ceramic", "Full body"] as const,
      `Variant ${i + 1} body`,
    ),
  };
}

function asset(a: unknown, i: number): MediaAsset {
  const o = object(a);
  return {
    id: typeof o.id === "string" && o.id ? o.id : crypto.randomUUID(),
    role: choice(
      o.role,
      ["tile-face", "room-preview", "closeup"] as const,
      `Asset ${i + 1} role`,
    ),
    previewUrl: text(o.previewUrl, `Asset ${i + 1} preview URL`, 2000),
    originalUrl:
      o.originalUrl === null
        ? null
        : typeof o.originalUrl === "string"
          ? text(o.originalUrl, `Asset ${i + 1} original URL`, 2000, false)
          : null,
    alt: text(o.alt, `Asset ${i + 1} alt description`, 300, false),
  };
}

export function validateProduct(raw: unknown): ProductDraft {
  const o = object(raw);
  const variantsRaw = Array.isArray(o.variants) ? o.variants : [];
  if (variantsRaw.length === 0)
    fail("Add at least one technical variant to your product.");
  if (variantsRaw.length > 20)
    fail("Products support up to 20 technical variants.");

  const facesRaw = Array.isArray(o.faces) ? o.faces : [];
  if (facesRaw.length > 50) fail("Products support up to 50 tile faces.");

  const mediaRaw = Array.isArray(o.media) ? o.media : [];
  if (mediaRaw.length > 50) fail("Products support up to 50 media assets.");

  return {
    name: text(o.name, "Product name", 160),
    code: text(o.code, "Product code", 64),
    collection: text(o.collection, "Collection", 100),
    status: choice(
      o.status,
      ["Active", "Draft", "Archived"] as const,
      "Status",
    ),
    description: text(o.description, "Description", 2000, false),
    tags: list(o.tags ?? [], "Tags"),
    colours: list(o.colours ?? [], "Colours"),
    showInPdf: bool(o.showInPdf ?? false, "Show in PDF"),
    private: bool(o.private ?? false, "Private flag"),
    has360: bool(o.has360 ?? false, "360 flag"),
    variants: variantsRaw.map(variant),
    faces: facesRaw.map(asset),
    media: mediaRaw.map(asset),
  };
}

export function validateBulk(raw: unknown): BulkChanges {
  const o = object(raw);
  const out: BulkChanges = {};
  if ("status" in o && o.status !== "")
    out.status = choice(
      o.status,
      ["Active", "Draft", "Archived"] as const,
      "Status",
    );
  if ("showInPdf" in o && typeof o.showInPdf === "boolean")
    out.showInPdf = o.showInPdf;
  if ("private" in o && typeof o.private === "boolean")
    out.private = o.private;
  if (Object.keys(out).length === 0)
    fail("Choose at least one property to update.");
  return out;
}

export function validateTargets(raw: unknown): ProductTarget[] {
  if (!Array.isArray(raw) || raw.length === 0) {
    fail("Select at least one product.");
  }
  return (raw as unknown[]).map((t) => {
    const o = object(t);
    return {
      id: text(o.id, "Target id", 120),
      revision: number(o.revision, "Target revision", 1000000),
    };
  });
}
