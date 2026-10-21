"use client";
import { useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  Check,
  Plus,
  Columns3,
  Download,
  Pencil,
  X,
} from "lucide-react";
import { Button, Badge } from "@/components/ui/primitives";
import type { Product, ProductDraft } from "./types";
import { readQuery, queryProducts } from "./query";
import { ProductTable } from "./product-table";
import { ProductEditor } from "./product-editor";
import { ProductDetails } from "./product-details";
import { BulkEditor } from "./bulk-editor";
import { ColumnPicker, useColumns } from "./columns";
import { downloadCsv } from "./export";
export function ProductManager({
  products: initialProducts,
}: {
  products: Product[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [editor, setEditor] = useState<Product | null | undefined>(undefined);
  const [columnPicker, setColumnPicker] = useState(false);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [advanced, setAdvanced] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const columnPrefs = useColumns();
  const pathname = usePathname(),
    params = useSearchParams();
  const query = readQuery(new URLSearchParams(params.toString()));
  const { filtered, visible } = queryProducts(products, query);
  const [selection, setSelection] = useState<{ view: string; ids: string[] }>({
    view: "",
    ids: [],
  });
  const view = params.toString();
  if (selection.view !== view) setSelection({ view, ids: [] });
  const selected = selection.view === view ? selection.ids : [];
  const [detail, setDetail] = useState<Product | null>(null);

  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete("page");
    window.history[key === "q" ? "replaceState" : "pushState"](
      null,
      "",
      `${pathname}?${next}`,
    );
  };
  const toggle = (id: string) =>
    setSelection({
      view,
      ids: selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    });
  const openDetails = (product: Product) => setDetail(product);
  const edit = (product: Product | null) => {
    setDetail(null);
    setEditor(product);
  };
  const filterKeys = [
    "size",
    "collection",
    "surface",
    "status",
    "body",
    "thickness",
    "tag",
    "colour",
    "pdf",
    "privacy",
    "preview",
  ];
  const filterCount = filterKeys.filter((k) => params.get(k)).length;
  const selectedProducts = visible.filter((p) => selected.includes(p.id));
  async function mutate(operation: string, payload: Record<string, unknown>) {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ operation, ...payload }),
      });
      const result = await response.json();
      if (!response.ok)
        throw new Error(result.error || "Could not save changes.");
      setProducts(result.products);
      setSelection({ view, ids: [] });
      return result.product as Product | undefined;
    } finally {
      setBusy(false);
    }
  }
  async function save(data: ProductDraft) {
    const saved = await mutate(editor ? "update" : "create", {
      data,
      ...(editor
        ? { target: { id: editor.id, revision: editor.revision } }
        : {}),
    });
    if (saved) {
      const next = new URLSearchParams({ q: saved.code });
      window.history.pushState(null, "", `${pathname}?${next}`);
    }
    setEditor(undefined);
    setNotice(`${saved?.name || "Product"} saved locally.`);
  }
  async function duplicate(product: Product) {
    try {
      const copy = await mutate("duplicate", {
        target: { id: product.id, revision: product.revision },
      });
      setDetail(null);
      setNotice(`Created ${copy?.code} as a draft.`);
      if (copy) setEditor(copy);
    } catch (e) {
      setDetail(null);
      setError(e instanceof Error ? e.message : "Could not duplicate product.");
    }
  }
  return (
    <>
      {(notice || error) && (
        <div
          className={`library-notice ${error ? "error" : ""}`}
          role={error ? "alert" : "status"}
        >
          <span>{error || notice}</span>
          <button
            aria-label="Dismiss message"
            onClick={() => {
              setNotice("");
              setError("");
            }}
          >
            <X size={15} />
          </button>
        </div>
      )}
      <section className="library" aria-label="Product library">
        <div className="library-heading">
          <div>
            <h1>All products</h1>
            <span>Organise. Inspect. Find your next selection.</span>
          </div>
          <div className="library-tools">
            <Button className="primary" disabled={busy} onClick={() => edit(null)}>
              <Plus size={15} /> Add product
            </Button>
            <Badge>Local library</Badge>
            <Button onClick={() => setColumnPicker(true)}>
              <Columns3 size={14} /> Columns
            </Button>
            <Button
              disabled={!filtered.length}
              onClick={() => {
                const rows = selectedProducts.length
                  ? selectedProducts
                  : filtered;
                downloadCsv(rows);
                setNotice(
                  `Exported ${rows.length} designs as CSV (one row per variant).`,
                );
              }}
            >
              <Download size={14} />{" "}
              {selectedProducts.length ? "Export selected" : "Export results"}
            </Button>
          </div>
        </div>
        <div className="toolbar">
          <label className="search">
            <Search size={17} />
            <input
              type="search"
              aria-label="Search products by name or code"
              placeholder="Search design name or code…"
              value={query.q}
              onChange={(e) => update("q", e.target.value)}
            />
            <kbd>⌕</kbd>
          </label>
          <div className="filter-title">
            <SlidersHorizontal size={15} /> Filters{" "}
            {filterCount > 0 && `(${filterCount})`}
          </div>
          <label className="filter">
            <span className="sr-only">Size</span>
            <select
              value={query.size}
              onChange={(e) => update("size", e.target.value)}
            >
              <option value="">All sizes</option>
              {[
                ...new Set(
                  products.flatMap((p) =>
                    p.variants.map((v) => `${v.widthMm}x${v.heightMm}`),
                  ),
                ),
              ]
                .sort()
                .map((s) => (
                  <option key={s} value={s}>
                    {s.replace("x", " × ")} mm
                  </option>
                ))}
            </select>
          </label>
          {(["collection", "surface", "status"] as const).map((key) => (
            <label className="filter" key={key}>
              <span className="sr-only">{key}</span>
              <select
                value={query[key]}
                onChange={(e) => update(key, e.target.value)}
              >
                <option value="">
                  {key === "collection"
                    ? "Collection"
                    : key === "surface"
                      ? "Surface"
                      : "Status"}
                </option>
                {[
                  ...new Set(
                    products.flatMap((p) =>
                      key === "surface"
                        ? p.variants.map((v) => v.surface)
                        : [p[key]],
                    ),
                  ),
                ]
                  .sort()
                  .map((v) => (
                    <option key={v}>{v}</option>
                  ))}
              </select>
            </label>
          ))}
          <Button
            aria-expanded={advanced}
            onClick={() => setAdvanced(!advanced)}
          >
            <SlidersHorizontal size={14} /> More filters
            {filterCount > 0 ? ` (${filterCount})` : ""}
          </Button>
          <Button
            className="clear"
            disabled={!query.q && !filterCount}
            onClick={() => window.history.pushState(null, "", pathname)}
          >
            Clear filters
          </Button>
        </div>
        {advanced && (
          <div className="advanced-filters">
            {(
              [
                [
                  "body",
                  "Body",
                  [
                    ...new Set(
                      products.flatMap((p) => p.variants.map((v) => v.body)),
                    ),
                  ],
                ],
                [
                  "thickness",
                  "Thickness (mm)",
                  [
                    ...new Set(
                      products.flatMap((p) =>
                        p.variants.map((v) => String(v.thicknessMm)),
                      ),
                    ),
                  ],
                ],
                ["tag", "Tag", [...new Set(products.flatMap((p) => p.tags))]],
                [
                  "colour",
                  "Colour",
                  [...new Set(products.flatMap((p) => p.colours))],
                ],
              ] as [string, string, string[]][]
            ).map(([key, label, options]) => (
              <label key={key}>
                {label}
                <select
                  value={params.get(key) || ""}
                  onChange={(e) => update(key, e.target.value)}
                >
                  <option value="">All</option>
                  {options.sort().map((v) => (
                    <option key={v}>{v}</option>
                  ))}
                </select>
              </label>
            ))}
            {(
              [
                ["pdf", "Show in PDF"],
                ["privacy", "Private"],
                ["preview", "Has preview image"],
              ] as const
            ).map(([key, label]) => (
              <label key={key}>
                {label}
                <select
                  value={params.get(key) || ""}
                  onChange={(e) => update(key, e.target.value)}
                >
                  <option value="">All</option>
                  <option value="yes">Yes</option>
                  <option value="no">No</option>
                </select>
              </label>
            ))}
          </div>
        )}
        <div className="selection-bar">
          <span>
            <strong>{filtered.length}</strong> designs{" "}
            <span className="muted">
              {filterCount || query.q
                ? "matching your filters"
                : "in your library"}
            </span>
          </span>
          <span aria-live="polite">
            {selected.length > 0 ? (
              <>
                <Check size={14} /> {selectedProducts.length} selected{" "}
                <Button onClick={() => setBulkOpen(true)} disabled={busy}>
                  <Pencil size={13} /> Bulk edit
                </Button>
                <button onClick={() => setSelection({ view, ids: [] })}>
                  Clear
                </button>
              </>
            ) : (
              <span className="muted">Select matching products</span>
            )}
          </span>
        </div>
        <ProductTable
          products={visible}
          selected={selected}
          columns={columnPrefs.visible}
          query={query}
          onToggle={toggle}
          onSelectAll={(checked) =>
            setSelection({ view, ids: checked ? visible.map((p) => p.id) : [] })
          }
          onSort={() => update("sort", query.sort === "asc" ? "desc" : "asc")}
          onDetails={openDetails}
          onEdit={edit}
          onReset={() => window.history.pushState(null, "", pathname)}
        />
      </section>
      {detail && (
        <ProductDetails
          product={detail}
          onClose={() => setDetail(null)}
          onEdit={() => edit(detail)}
          onDuplicate={() => duplicate(detail)}
          busy={busy}
        />
      )}
      {editor !== undefined && (
        <ProductEditor
          key={editor?.id || "new"}
          product={editor}
          collections={[...new Set(products.map((p) => p.collection))].sort()}
          onClose={() => setEditor(undefined)}
          onSave={save}
        />
      )}
      {columnPicker && (
        <ColumnPicker
          visible={columnPrefs.visible}
          onChange={columnPrefs.set}
          onClose={() => setColumnPicker(false)}
        />
      )}
      {bulkOpen && (
        <BulkEditor
          products={selectedProducts}
          onClose={() => setBulkOpen(false)}
          onSave={async (changes) => {
            await mutate("bulk", {
              targets: selectedProducts.map((p) => ({
                id: p.id,
                revision: p.revision,
              })),
              changes,
            });
            setBulkOpen(false);
            setNotice("Selected products updated.");
          }}
        />
      )}
    </>
  );
}
