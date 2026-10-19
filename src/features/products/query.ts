import type { Product } from "./types";
export interface ProductQuery {
  q: string;
  size: string;
  collection: string;
  surface: string;
  status: string;
  sort: string;
  page: number;
}
export const PAGE_SIZE = 8;
export function readQuery(params: URLSearchParams): ProductQuery {
  return {
    q: params.get("q") || "",
    size: params.get("size") || "",
    collection: params.get("collection") || "",
    surface: params.get("surface") || "",
    status: params.get("status") || "",
    sort: params.get("sort") === "desc" ? "desc" : "asc",
    page: Math.max(1, Math.floor(Number(params.get("page")) || 1)),
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
        p.variants.some(
          (v) =>
            (!query.size || `${v.widthMm}x${v.heightMm}` === query.size) &&
            (!query.surface || v.surface === query.surface),
        ),
    )
    .sort(
      (a, b) => a.name.localeCompare(b.name) * (query.sort === "desc" ? -1 : 1),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const page = Math.min(query.page, pages);
  return {
    filtered,
    pages,
    page,
    visible: filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
  };
}
