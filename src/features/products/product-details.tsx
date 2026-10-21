"use client";
import { useState } from "react";
import Image from "next/image";
import { Copy, Download, Pencil, ImageOff } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button, Badge } from "@/components/ui/primitives";
import { type Product, type MediaAsset, sizeLabel } from "./types";
export function ProductDetails({
  product: p,
  onClose,
  onEdit,
  onDuplicate,
  busy,
}: {
  product: Product;
  onClose: () => void;
  onEdit: () => void;
  onDuplicate: () => void;
  busy: boolean;
}) {
  const [tab, setTab] = useState("Properties");
  const [asset, setAsset] = useState<MediaAsset | null>(
    p.faces[0] || p.media[0] || null,
  );
  const media = tab === "Design" ? p.faces : p.media;
  return (
    <Modal title="Product details" onClose={onClose} busy={busy} wide>
      <div
        className="editor-tabs"
        role="tablist"
        aria-label="Product detail sections"
      >
        {["Properties", "Design", "Media"].map((t) => (
          <button
            type="button"
            role="tab"
            id={`detail-tab-${t}`}
            aria-controls={`detail-${t}`}
            aria-selected={tab === t}
            key={t}
            onClick={() => {
              setTab(t);
              if (t === "Design") setAsset(p.faces[0] || null);
              if (t === "Media") setAsset(p.media[0] || null);
            }}
          >
            {t}
            {t === "Design"
              ? ` (${p.faces.length})`
              : t === "Media"
                ? ` (${p.media.length})`
                : ""}
          </button>
        ))}
      </div>
      <div className="modal-body">
        <div className="section-row">
          <div>
            <Badge>{p.collection}</Badge>
            <h2 className="detail-name">{p.name}</h2>
            <p className="muted">
              {p.code} {p.isSample ? "· Sample design" : ""}
            </p>
          </div>
          <span className={`status ${p.status.toLowerCase()}`}>
            <span />
            {p.status}
          </span>
        </div>
        <div
          role="tabpanel"
          id={`detail-${tab}`}
          aria-labelledby={`detail-tab-${tab}`}
        >
          {tab === "Properties" ? (
            <>
              <p className="product-description">
                {p.description || "No description added."}
              </p>
              <dl className="specs">
                <div>
                  <dt>Tags</dt>
                  <dd>{p.tags.join(", ") || "—"}</dd>
                </div>
                <div>
                  <dt>Colours</dt>
                  <dd>{p.colours.join(", ") || "—"}</dd>
                </div>
                <div>
                  <dt>Show in PDF</dt>
                  <dd>{p.showInPdf ? "Yes" : "No"}</dd>
                </div>
                <div>
                  <dt>Private</dt>
                  <dd>{p.private ? "Yes" : "No"}</dd>
                </div>
              </dl>
              <h3>Technical variants ({p.variants.length})</h3>
              {p.variants.map((v) => (
                <dl className="specs" key={v.id}>
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
              <p className="asset-note">
                Updated {new Date(p.updatedAt).toLocaleString()} · Revision{" "}
                {p.revision}. Visibility preferences are stored for future
                catalogue sharing.
              </p>
            </>
          ) : (
            <>
              {asset ? (
                <>
                  <Image
                    className="hero-tile"
                    src={asset.previewUrl}
                    width={600}
                    height={400}
                    alt={asset.alt}
                    unoptimized
                  />
                  <div className="section-row">
                    <span>{asset.alt}</span>
                    {asset.originalUrl && (
                      <a className="button" href={asset.originalUrl} download>
                        <Download size={14} /> Download original
                      </a>
                    )}
                  </div>
                </>
              ) : (
                <div className="media-empty">
                  <ImageOff size={28} />
                  <p>
                    No{" "}
                    {tab === "Design"
                      ? "tile faces"
                      : "room previews or closeups"}{" "}
                    added yet.
                  </p>
                  <Button onClick={onEdit}>Add images</Button>
                </div>
              )}
              <div className="face-grid detail-gallery">
                {media.map((a, i) => (
                  <button
                    aria-label={`View image ${i + 1}: ${a.alt}`}
                    aria-pressed={asset?.id === a.id}
                    key={a.id}
                    onClick={() => setAsset(a)}
                  >
                    <Image
                      src={a.previewUrl}
                      width={130}
                      height={100}
                      alt={a.alt}
                      unoptimized
                    />
                    <small>
                      {tab === "Design"
                        ? `Face ${i + 1}`
                        : a.role === "room-preview"
                          ? "Room preview"
                          : "Closeup"}
                    </small>
                  </button>
                ))}
              </div>
              {p.isSample && (
                <p className="asset-note">
                  Bundled textures are illustrative samples. Uploaded images
                  retain their original resolution and colours.
                </p>
              )}
            </>
          )}
        </div>
      </div>
      <div className="modal-actions">
        <Button onClick={onDuplicate} disabled={busy}>
          <Copy size={14} /> {busy ? "Duplicating…" : "Duplicate as draft"}
        </Button>
        <Button className="primary" onClick={onEdit} disabled={busy}>
          <Pencil size={14} /> Edit product
        </Button>
      </div>
    </Modal>
  );
}
