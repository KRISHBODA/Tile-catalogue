"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { usePathname, useSearchParams } from "next/navigation";
import {
  Search,
  SlidersHorizontal,
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronLeft,
  ChevronRight,
  X,
  ArrowUpRight,
  Layers,
  Check,
  ImageOff,
  Info,
} from "lucide-react";
import { Button, Badge } from "@/components/ui/primitives";
import { type Product, sizeLabel } from "./types";
import { PAGE_SIZE, readQuery, queryProducts } from "./query";
export function ProductManager({ products }: { products: Product[] }) {
  const pathname = usePathname(),
    params = useSearchParams();
  const query = readQuery(new URLSearchParams(params.toString()));
  const { filtered, pages, page, visible } = queryProducts(products, query);
  const [selection, setSelection] = useState<{ view: string; ids: string[] }>({
    view: "",
    ids: [],
  });
  const view = params.toString();
  if (selection.view !== view) setSelection({ view, ids: [] });
  const selected = selection.view === view ? selection.ids : [];
  const [detail, setDetail] = useState<Product | null>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const selectAll = useRef<HTMLInputElement>(null);
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params.toString());
    if (value) next.set(key, value);
    else next.delete(key);
    if (key !== "page") next.delete("page");
    window.history[key === "q" ? "replaceState" : "pushState"](
      null,
      "",
      `${pathname}?${next}`,
    );
  };
  useEffect(() => {
    if (selectAll.current)
      selectAll.current.indeterminate =
        selected.length > 0 && selected.length < visible.length;
  }, [selected.length, visible.length]);
  const toggle = (id: string) =>
    setSelection({
      view,
      ids: selected.includes(id)
        ? selected.filter((x) => x !== id)
        : [...selected, id],
    });
  const openDetails = (product: Product) => {
    setDetail(product);
    dialog.current?.showModal();
  };
  const filterCount = ["size", "collection", "surface", "status"].filter((k) =>
    params.get(k),
  ).length;
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">YOUR MATERIAL LIBRARY</span>
          <h1>
            Product Manager<span className="count">{products.length}</span>
          </h1>
          <p>A considered collection. Every detail, in one place.</p>
        </div>
        <div className="heading-note">
          <Layers size={17} />
          <span>
            Foundation milestone<small>Explore your sample library</small>
          </span>
        </div>
      </div>
      <div className="summary-grid">
        <div>
          <span>Total designs</span>
          <strong>
            {products.length.toString().padStart(2, "0")}
            <small>Across your library</small>
          </strong>
        </div>
        <div>
          <span>Active products</span>
          <strong>
            {products
              .filter((p) => p.status === "Active")
              .length.toString()
              .padStart(2, "0")}
            <small>Available designs</small>
          </strong>
        </div>
        <div>
          <span>Collections</span>
          <strong>
            {new Set(products.map((p) => p.collection)).size
              .toString()
              .padStart(2, "0")}
            <small>Materials & finishes</small>
          </strong>
        </div>
        <div className="summary-note">
          <Info size={17} />
          <p>
            A preview of what’s possible.
            <small>
              Illustrative products and textures. No changes are saved.
            </small>
          </p>
        </div>
      </div>
      <section className="library" aria-label="Product library">
        <div className="library-heading">
          <div>
            <h2>All products</h2>
            <span>Organise. Inspect. Find your next selection.</span>
          </div>
          <Badge>Sample library</Badge>
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
              {["600x600", "600x1200", "1200x1200", "1200x2400"].map((s) => (
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
            className="clear"
            disabled={!query.q && !filterCount}
            onClick={() => window.history.pushState(null, "", pathname)}
          >
            Clear filters
          </Button>
        </div>
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
                <Check size={14} /> {selected.length} selected{" "}
                <button onClick={() => setSelection({ view, ids: [] })}>
                  Clear
                </button>
              </>
            ) : (
              <span className="muted">Select products on this page</span>
            )}
          </span>
        </div>
        <div
          className="table-scroll"
          role="region"
          aria-label="Scrollable product table"
          tabIndex={0}
        >
          <table>
            <thead>
              <tr>
                <th className="check-cell">
                  <input
                    ref={selectAll}
                    type="checkbox"
                    aria-label="Select all products on this page"
                    checked={
                      visible.length > 0 && selected.length === visible.length
                    }
                    disabled={!visible.length}
                    onChange={(e) =>
                      setSelection({
                        view,
                        ids: e.target.checked ? visible.map((p) => p.id) : [],
                      })
                    }
                  />
                </th>
                <th>Tile face</th>
                <th>Room</th>
                <th
                  aria-sort={query.sort === "asc" ? "ascending" : "descending"}
                >
                  <button
                    className="sort"
                    onClick={() =>
                      update("sort", query.sort === "asc" ? "desc" : "asc")
                    }
                  >
                    Design{" "}
                    {query.sort === "asc" ? (
                      <ArrowDownAZ size={15} />
                    ) : (
                      <ArrowUpAZ size={15} />
                    )}
                  </button>
                </th>
                <th>
                  Size <small>mm</small>
                </th>
                <th>Collection</th>
                <th>Surface</th>
                <th>
                  THK <small>mm</small>
                </th>
                <th>Faces</th>
                <th>Status</th>
                <th>
                  <span className="sr-only">Details</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {visible.map((p) => {
                const v =
                  p.variants.find(
                    (v) =>
                      (!query.size ||
                        `${v.widthMm}x${v.heightMm}` === query.size) &&
                      (!query.surface || v.surface === query.surface),
                  ) || p.variants[0];
                return (
                  <tr
                    key={p.id}
                    className={selected.includes(p.id) ? "selected" : ""}
                  >
                    <td className="check-cell">
                      <input
                        type="checkbox"
                        aria-label={`Select ${p.name}`}
                        checked={selected.includes(p.id)}
                        onChange={() => toggle(p.id)}
                      />
                    </td>
                    <td>
                      <button
                        className="thumb-button"
                        aria-label={`Inspect ${p.name}`}
                        onClick={() => openDetails(p)}
                      >
                        <Image
                          src={p.faces[0].previewUrl}
                          width={48}
                          height={48}
                          alt={p.faces[0].alt}
                          unoptimized
                        />
                      </button>
                    </td>
                    <td>
                      <div
                        className="missing-room"
                        title="No room preview supplied"
                      >
                        <ImageOff size={16} />
                        <span>None</span>
                      </div>
                    </td>
                    <td>
                      <button
                        className="design-name"
                        onClick={() => openDetails(p)}
                      >
                        {p.name}
                      </button>
                      <small className="code">
                        {p.code}
                        {p.variants.length > 1 && (
                          <span> · {p.variants.length} variants</span>
                        )}
                      </small>
                    </td>
                    <td className="size-cell">{sizeLabel(v)}</td>
                    <td>{p.collection}</td>
                    <td>{v.surface}</td>
                    <td>{v.thicknessMm}</td>
                    <td>{p.faces.length}</td>
                    <td>
                      <span className={`status ${p.status.toLowerCase()}`}>
                        <span />
                        {p.status}
                      </span>
                    </td>
                    <td>
                      <Button
                        className="icon-button"
                        aria-label={`View details for ${p.name}`}
                        onClick={() => openDetails(p)}
                      >
                        <ArrowUpRight size={17} />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {!visible.length && (
            <div className="empty">
              <Search size={28} />
              <h3>No designs found</h3>
              <p>Try a different name or clear your filters.</p>
              <Button
                onClick={() => window.history.pushState(null, "", pathname)}
              >
                Clear filters
              </Button>
            </div>
          )}
        </div>
        <div className="pagination">
          <span>
            {filtered.length
              ? `${(page - 1) * PAGE_SIZE + 1}–${Math.min(page * PAGE_SIZE, filtered.length)}`
              : "0"}{" "}
            of {filtered.length} designs
            <span className="page-size"> · {PAGE_SIZE} per page</span>
          </span>
          <div>
            <Button
              className="icon-button"
              aria-label="Previous page"
              disabled={page === 1}
              onClick={() => update("page", String(page - 1))}
            >
              <ChevronLeft size={16} />
            </Button>
            {Array.from({ length: pages }, (_, i) => (
              <Button
                key={i}
                className={
                  page === i + 1 ? "page-number primary" : "page-number"
                }
                aria-label={`Page ${i + 1}`}
                aria-current={page === i + 1 ? "page" : undefined}
                onClick={() => update("page", String(i + 1))}
              >
                {i + 1}
              </Button>
            ))}
            <Button
              className="icon-button"
              aria-label="Next page"
              disabled={page === pages}
              onClick={() => update("page", String(page + 1))}
            >
              <ChevronRight size={16} />
            </Button>
          </div>
        </div>
      </section>
      <div className="below-table">
        <Info size={14} />
        <span>
          Sample data only. Selection is page-specific and clears when you
          search, filter, sort or change pages.
        </span>
      </div>
      <dialog
        ref={dialog}
        className="details"
        aria-labelledby="detail-title"
        onClick={(e) => {
          if (e.target === e.currentTarget) dialog.current?.close();
        }}
      >
        {detail && (
          <>
            <header>
              <span className="eyebrow">DESIGN DETAILS · READ ONLY</span>
              <Button
                className="icon-button"
                aria-label="Close product details"
                onClick={() => dialog.current?.close()}
              >
                <X size={19} />
              </Button>
            </header>
            <div className="detail-body">
              <Badge>{detail.collection}</Badge>
              <h2 id="detail-title">{detail.name}</h2>
              <p className="muted">
                {detail.code} · Illustrative sample product
              </p>
              <Image
                className="hero-tile"
                src={detail.faces[0].previewUrl}
                width={600}
                height={400}
                alt={detail.faces[0].alt}
                unoptimized
              />
              <h3>
                Technical variants{" "}
                <span className="muted">({detail.variants.length})</span>
              </h3>
              {detail.variants.map((v) => (
                <dl key={v.id} className="specs">
                  <div>
                    <dt>Size</dt>
                    <dd>{sizeLabel(v)} mm</dd>
                  </div>
                  <div>
                    <dt>Surface</dt>
                    <dd>{v.surface}</dd>
                  </div>
                  <div>
                    <dt>Thickness</dt>
                    <dd>{v.thicknessMm} mm</dd>
                  </div>
                  <div>
                    <dt>Body</dt>
                    <dd>{v.body}</dd>
                  </div>
                </dl>
              ))}
              <h3>
                Tile faces{" "}
                <span className="muted">({detail.faces.length})</span>
              </h3>
              <div className="face-grid">
                {detail.faces.map((f, i) => (
                  <figure key={f.id}>
                    <Image
                      src={f.previewUrl}
                      width={130}
                      height={130}
                      alt={f.alt}
                      unoptimized
                    />
                    <figcaption>
                      Face {String(i + 1).padStart(2, "0")}
                    </figcaption>
                  </figure>
                ))}
              </div>
              <p className="asset-note">
                Illustrative texture reused across faces. Original-resolution
                assets and room previews have not been supplied.
              </p>
              <dl className="specs">
                <div>
                  <dt>Status</dt>
                  <dd>{detail.status}</dd>
                </div>
                <div>
                  <dt>Show in PDF</dt>
                  <dd>{detail.showInPdf ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt>Private</dt>
                  <dd>{detail.private ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt>Room preview</dt>
                  <dd>Not supplied</dd>
                </div>
              </dl>
            </div>
            <div className="detail-footer">
              <Button
                className="primary"
                onClick={() => dialog.current?.close()}
              >
                Done
              </Button>
            </div>
          </>
        )}
      </dialog>
    </>
  );
}
