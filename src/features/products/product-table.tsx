"use client";
import { useEffect, useRef } from "react";
import Image from "next/image";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  ChevronRight,
  ImageOff,
  Pencil,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/primitives";
import type { Product } from "./types";
import { sizeLabel } from "./types";
import type { Column } from "./columns";
import type { ProductQuery } from "./query";
import { variantMatches } from "./query";
export function ProductTable({
  products,
  selected,
  columns,
  query,
  onToggle,
  onSelectAll,
  onSort,
  onDetails,
  onEdit,
  onReset,
}: {
  products: Product[];
  selected: string[];
  columns: Column[];
  query: ProductQuery;
  onToggle: (id: string) => void;
  onSelectAll: (checked: boolean) => void;
  onSort: () => void;
  onDetails: (p: Product) => void;
  onEdit: (p: Product) => void;
  onReset: () => void;
}) {
  const all = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (all.current)
      all.current.indeterminate =
        selected.length > 0 && selected.length < products.length;
  }, [selected.length, products.length]);
  const has = (key: Column) => columns.includes(key);
  return (
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
                ref={all}
                type="checkbox"
                aria-label="Select all matching products"
                checked={
                  products.length > 0 && selected.length === products.length
                }
                disabled={!products.length}
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </th>
            {has("tile") && <th>Tile face</th>}
            {has("room") && <th>Preview</th>}
            <th aria-sort={query.sort === "asc" ? "ascending" : "descending"}>
              <button className="sort" onClick={onSort}>
                Design{" "}
                {query.sort === "asc" ? (
                  <ArrowDownAZ size={15} />
                ) : (
                  <ArrowUpAZ size={15} />
                )}
              </button>
            </th>
            {has("size") && (
              <th>
                Size <small>mm</small>
              </th>
            )}
            {has("collection") && <th>Collection</th>}
            {has("surface") && <th>Surface</th>}
            {has("thickness") && (
              <th>
                THK <small>mm</small>
              </th>
            )}
            {has("faces") && <th>Faces</th>}
            {has("status") && <th>Status</th>}
            {has("tags") && <th>Tags</th>}
            {has("colours") && <th>Colours</th>}
            {has("body") && <th>Body</th>}
            {has("pdf") && <th>Show in PDF</th>}
            {has("private") && <th>Private</th>}
            {has("360") && <th>360</th>}
            <th>
              <span className="sr-only">Actions</span>
            </th>
          </tr>
        </thead>
        <tbody>
          {products.map((p) => {
            const v =
                p.variants.find((v) => variantMatches(v, query)) ||
                p.variants[0],
              face = p.faces[0],
              room = p.media.find((m) => m.role === "room-preview");
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
                    onChange={() => onToggle(p.id)}
                  />
                </td>
                {has("tile") && (
                  <td>
                    {face ? (
                      <button
                        className="thumb-button product-image-preview"
                        aria-label={`Inspect ${p.name}`}
                        onClick={() => onDetails(p)}
                      >
                        <Image
                          src={face.previewUrl}
                          width={220}
                          height={124}
                          alt={face.alt}
                          unoptimized
                        />
                      </button>
                    ) : (
                      <div
                        className="missing-room product-image-preview"
                        title="No tile image"
                      >
                        <ImageOff size={16} />
                        <span>None</span>
                      </div>
                    )}
                  </td>
                )}
                {has("room") && (
                  <td>
                    {room ? (
                      <button
                        className="thumb-button product-image-preview"
                        aria-label={`Preview for ${p.name}`}
                        onClick={() => onDetails(p)}
                      >
                        <Image
                          src={room.previewUrl}
                          width={220}
                          height={124}
                          alt={room.alt}
                          unoptimized
                        />
                      </button>
                    ) : (
                      <div
                        className="missing-room product-image-preview"
                        title="No preview image supplied"
                      >
                        <ImageOff size={16} />
                        <span>None</span>
                      </div>
                    )}
                  </td>
                )}
                <td>
                  <button className="design-name" onClick={() => onDetails(p)}>
                    {p.name}
                  </button>
                  <small className="code">
                    {p.code}
                    {p.variants.length > 1 && (
                      <span> · {p.variants.length} variants</span>
                    )}
                  </small>
                </td>
                {has("size") && <td className="size-cell">{sizeLabel(v)}</td>}
                {has("collection") && <td>{p.collection}</td>}
                {has("surface") && <td>{v.surface}</td>}
                {has("thickness") && <td>{v.thicknessMm}</td>}
                {has("faces") && <td>{p.faces.length}</td>}
                {has("status") && (
                  <td>
                    <span className={`status ${p.status.toLowerCase()}`}>
                      <span />
                      {p.status}
                    </span>
                  </td>
                )}
                {has("tags") && (
                  <td className="text-cell" title={p.tags.join(", ")}>
                    {p.tags.join(", ") || "—"}
                  </td>
                )}
                {has("colours") && (
                  <td className="text-cell">{p.colours.join(", ") || "—"}</td>
                )}
                {has("body") && <td>{v.body}</td>}
                {has("pdf") && <td>{p.showInPdf ? "Yes" : "No"}</td>}
                {has("private") && <td>{p.private ? "Yes" : "No"}</td>}
                {has("360") && <td>{p.has360 ? "Yes" : "No"}</td>}
                <td>
                  <div className="row-actions">
                    <Button
                      className="icon-button"
                      aria-label={`Edit ${p.name}`}
                      onClick={() => onEdit(p)}
                    >
                      <Pencil size={14} />
                    </Button>
                    <Button
                      className="icon-button"
                      aria-label={`View details for ${p.name}`}
                      title="View design details"
                      onClick={() => onDetails(p)}
                    >
                      <ChevronRight size={18} aria-hidden="true" />
                    </Button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      {!products.length && (
        <div className="empty">
          <Search size={28} />
          <h3>No designs found</h3>
          <p>Try a different name or clear your filters.</p>
          <Button onClick={onReset}>Clear filters</Button>
        </div>
      )}
    </div>
  );
}
