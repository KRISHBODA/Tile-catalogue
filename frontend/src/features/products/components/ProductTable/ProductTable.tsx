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
import { Button } from "@/components/common";
import type { Product } from "../../types";
import { sizeLabel } from "../../types";
import type { Column } from "../../hooks/useColumns";
import type { ProductQuery } from "../../utils/query";
import { variantMatches } from "../../utils/query";

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
                aria-label="Select all products matching query"
                checked={
                  products.length > 0 && selected.length === products.length
                }
                onChange={(e) => onSelectAll(e.target.checked)}
              />
            </th>
            {has("tile") && <th>Tile</th>}
            {has("room") && <th>Preview</th>}
            <th className="sortable">
              <button
                type="button"
                onClick={onSort}
                aria-label={`Sort by name, currently ${query.sort === "desc" ? "descending" : "ascending"}`}
              >
                Design name
                {query.sort === "desc" ? (
                  <ArrowDownAZ size={14} />
                ) : (
                  <ArrowUpAZ size={14} />
                )}
              </button>
            </th>
            <th>Code</th>
            {has("collection") && <th>Collection</th>}
            {has("size") && <th>Sizes (mm)</th>}
            {has("surface") && <th>Surfaces</th>}
            {has("thickness") && <th>Thickness</th>}
            {has("body") && <th>Body</th>}
            {has("faces") && <th>Faces</th>}
            {has("status") && <th>Status</th>}
            {has("tags") && <th>Tags</th>}
            {has("colours") && <th>Colours</th>}
            {has("pdf") && <th>In PDF</th>}
            {has("private") && <th>Private</th>}
            {has("360") && <th>360</th>}
            <th className="action-cell">Actions</th>
          </tr>
        </thead>
        <tbody>
          {products.length === 0 ? (
            <tr>
              <td colSpan={columns.length + 3} className="empty-cell">
                <Search size={24} />
                <p>No products match your current search and filters.</p>
                <Button onClick={onReset}>Clear all filters</Button>
              </td>
            </tr>
          ) : (
            products.map((p) => {
              const checked = selected.includes(p.id);
              const preview = p.faces[0];
              const room = p.media.find((m) => m.role === "room-preview");
              const matchingVariants = p.variants.filter((v) =>
                variantMatches(v, query),
              );
              const displayVariants = matchingVariants.length
                ? matchingVariants
                : p.variants;
              return (
                <tr
                  key={p.id}
                  className={checked ? "selected" : ""}
                  onClick={() => onToggle(p.id)}
                >
                  <td className="check-cell" onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${p.name}`}
                      checked={checked}
                      onChange={() => onToggle(p.id)}
                    />
                  </td>
                  {has("tile") && (
                    <td className="image-cell">
                      {preview ? (
                        <Image
                          src={preview.previewUrl}
                          width={48}
                          height={48}
                          alt={preview.alt}
                          unoptimized
                        />
                      ) : (
                        <div className="no-image" aria-label="No image">
                          <ImageOff size={16} />
                        </div>
                      )}
                    </td>
                  )}
                  {has("room") && (
                    <td className="image-cell">
                      {room ? (
                        <Image
                          src={room.previewUrl}
                          width={48}
                          height={48}
                          alt={room.alt}
                          unoptimized
                        />
                      ) : (
                        <div className="no-image" aria-label="No room preview">
                          <ImageOff size={16} />
                        </div>
                      )}
                    </td>
                  )}
                  <td>
                    <button
                      type="button"
                      className="link"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDetails(p);
                      }}
                    >
                      {p.name}
                    </button>
                  </td>
                  <td>
                    <code>{p.code}</code>
                  </td>
                  {has("collection") && <td>{p.collection}</td>}
                  {has("size") && (
                    <td>
                      {Array.from(
                        new Set(displayVariants.map((v) => sizeLabel(v))),
                      ).join(", ")}
                    </td>
                  )}
                  {has("surface") && (
                    <td>
                      {Array.from(
                        new Set(displayVariants.map((v) => v.surface)),
                      ).join(", ")}
                    </td>
                  )}
                  {has("thickness") && (
                    <td>
                      {Array.from(
                        new Set(displayVariants.map((v) => `${v.thicknessMm} mm`)),
                      ).join(", ")}
                    </td>
                  )}
                  {has("body") && (
                    <td>
                      {Array.from(
                        new Set(displayVariants.map((v) => v.body)),
                      ).join(", ")}
                    </td>
                  )}
                  {has("faces") && (
                    <td>{p.faces.length ? p.faces.length : "—"}</td>
                  )}
                  {has("status") && (
                    <td>
                      <span className={`status ${p.status.toLowerCase()}`}>
                        <span />
                        {p.status}
                      </span>
                    </td>
                  )}
                  {has("tags") && <td>{p.tags.join(", ") || "—"}</td>}
                  {has("colours") && <td>{p.colours.join(", ") || "—"}</td>}
                  {has("pdf") && <td>{p.showInPdf ? "Yes" : "No"}</td>}
                  {has("private") && <td>{p.private ? "Yes" : "No"}</td>}
                  {has("360") && <td>{p.has360 ? "Yes" : "No"}</td>}
                  <td
                    className="action-cell"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      type="button"
                      className="row-button"
                      aria-label={`Edit ${p.name}`}
                      onClick={() => onEdit(p)}
                    >
                      <Pencil size={14} />
                    </button>
                    <button
                      type="button"
                      className="row-button"
                      aria-label={`Open details for ${p.name}`}
                      onClick={() => onDetails(p)}
                    >
                      <ChevronRight size={16} />
                    </button>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}
