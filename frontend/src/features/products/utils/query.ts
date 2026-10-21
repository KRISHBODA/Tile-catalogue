import type { Product, TechnicalVariant } from "../types";

export interface ProductQuery {
  q: string;
  size: string;
  collection: string;
  surface: string;
  status: string;
  thickness: string;
  body: string;
  tag: string;
  colour: string;
  pdf: string;
  privacy: string;
  preview: string;
  sort: string;
}

export function readQuery(params: URLSearchParams): ProductQuery {
  return {
    q: params.get("q") || "",
    size: params.get("size") || "",
    collection: params.get("collection") || "",
    surface: params.get("surface") || "",
    status: params.get("status") || "",
    thickness: params.get("thickness") || "",
    body: params.get("body") || "",
    tag: params.get("tag") || "",
    colour: params.get("colour") || "",
    pdf: params.get("pdf") || "",
    privacy: params.get("privacy") || "",
    preview: params.get("preview") || "",
    sort: params.get("sort") === "desc" ? "desc" : "asc",
  };
}

export function queryProducts(products: Product[], query: ProductQuery) {
  const filtered = products
    .filter(
      (p) =>
        (!query.q ||
          `${p.name} ${p.code}`
            .toLowerCase()
            .includes(query.q.toLowerCase())) &&
        (!query.collection || p.collection === query.collection) &&
        (!query.status || p.status === query.status) &&
        (!query.tag || p.tags.includes(query.tag)) &&
        (!query.colour || p.colours.includes(query.colour)) &&
        (!query.pdf || p.showInPdf === (query.pdf === "yes")) &&
        (!query.privacy || p.private === (query.privacy === "yes")) &&
        (!query.preview ||
          p.media.some((m) => m.role === "room-preview") ===
            (query.preview === "yes")) &&
        p.variants.some((v) => variantMatches(v, query)),
    )
    .sort(
      (a, b) => a.name.localeCompare(b.name) * (query.sort === "desc" ? -1 : 1),
    );
  return { filtered, visible: filtered };
}

export function variantMatches(v: TechnicalVariant, query: ProductQuery) {
  return (
    (!query.size || `${v.widthMm}x${v.heightMm}` === query.size) &&
    (!query.surface || v.surface === query.surface) &&
    (!query.body || v.body === query.body) &&
    (!query.thickness || v.thicknessMm === Number(query.thickness))
  );
}
