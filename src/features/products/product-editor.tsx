"use client";
import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { Plus, Trash2, Upload } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/primitives";
import type {
  MediaAsset,
  MediaRole,
  Product,
  ProductDraft,
  TechnicalVariant,
} from "./types";
import { validateProduct } from "./validation";
const blank = (): ProductDraft => ({
  name: "",
  code: "",
  collection: "",
  description: "",
  tags: [],
  colours: [],
  status: "Draft",
  showInPdf: false,
  private: false,
  variants: [
    {
      id: crypto.randomUUID(),
      widthMm: 600,
      heightMm: 1200,
      thicknessMm: 9,
      surface: "Matt",
      body: "Porcelain",
    },
  ],
  faces: [],
  media: [],
});
export function ProductEditor({
  product,
  collections,
  onClose,
  onSave,
}: {
  product: Product | null;
  collections: string[];
  onClose: () => void;
  onSave: (data: ProductDraft) => Promise<void>;
}) {
  const [draft, setDraft] = useState<ProductDraft>(() =>
    product ? structuredClone(product) : blank(),
  );
  const [tab, setTab] = useState("Properties");
  const [error, setError] = useState("");
  const errorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (error) {
      errorRef.current?.scrollIntoView({ block: "nearest" });
      errorRef.current?.focus();
    }
  }, [error]);
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [role, setRole] = useState<MediaRole>("tile-face");
  const [tags, setTags] = useState(draft.tags.join(", "));
  const [colours, setColours] = useState(draft.colours.join(", "));
  function patch<K extends keyof ProductDraft>(key: K, value: ProductDraft[K]) {
    setDraft((p) => ({ ...p, [key]: value }));
    setDirty(true);
  }
  function variant(id: string, patch: Partial<TechnicalVariant>) {
    setDraft((p) => ({
      ...p,
      variants: p.variants.map((v) => (v.id === id ? { ...v, ...patch } : v)),
    }));
    setDirty(true);
  }
  function close() {
    if (!dirty || window.confirm("Discard unsaved product changes?")) onClose();
  }
  async function save(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setBusy(true);
    try {
      const data = validateProduct({
        ...draft,
        tags: tags
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        colours: colours
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
      });
      await onSave(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save this product.");
    } finally {
      setBusy(false);
    }
  }
  async function upload(files: FileList | null) {
    if (!files?.length) return;
    setError("");
    const key = role === "tile-face" ? "faces" : "media";
    if (draft[key].length + files.length > 30) {
      setError("Use up to 30 images per media group.");
      return;
    }
    setUploading(true);
    try {
      for (const file of Array.from(files)) {
        if (file.size > 10 * 1024 * 1024)
          throw new Error(`${file.name}: images must be 10 MB or smaller.`);
        const form = new FormData();
        form.set("file", file);
        const response = await fetch("/api/media", {
          method: "POST",
          body: form,
        });
        const result = await response.json();
        if (!response.ok) throw new Error(result.error || "Upload failed.");
        const asset: MediaAsset = {
          id: result.id,
          role,
          previewUrl: result.url,
          originalUrl: result.url,
          alt: file.name.slice(0, 200),
        };
        setDraft((p) => ({ ...p, [key]: [...p[key], asset] }));
        setDirty(true);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
    }
  }
  const allMedia = [...draft.faces, ...draft.media];
  return (
    <Modal
      title={product ? "Edit product" : "Add product"}
      onClose={close}
      busy={busy || uploading}
      wide
    >
      <form onSubmit={save} className="product-form" noValidate>
        <div
          className="editor-tabs"
          role="tablist"
          aria-label="Product editor sections"
        >
          {["Properties", "Variants", "Media"].map((t) => (
            <button
              type="button"
              key={t}
              role="tab"
              aria-selected={tab === t}
              aria-controls={`editor-${t}`}
              id={`tab-${t}`}
              onClick={() => setTab(t)}
            >
              {t}
              {t === "Variants"
                ? ` (${draft.variants.length})`
                : t === "Media"
                  ? ` (${allMedia.length})`
                  : ""}
            </button>
          ))}
        </div>
        <div className="modal-body">
          <p className="form-intro">
            {product
              ? `${product.code} · Edit the design and its available specifications.`
              : "Add a design to your library. Images can be added now or later."}
          </p>
          {error && (
            <div ref={errorRef} tabIndex={-1} className="form-error" role="alert">
              {error}
            </div>
          )}
          <fieldset disabled={busy || uploading}>
            {tab === "Properties" && (
              <div
                role="tabpanel"
                id="editor-Properties"
                aria-labelledby="tab-Properties"
              >
                <div className="form-grid">
                  <label>
                    Design name *
                    <input
                      value={draft.name}
                      maxLength={120}
                      onChange={(e) => patch("name", e.target.value)}
                      data-autofocus
                      placeholder="e.g. Calacatta Gold"
                    />
                  </label>
                  <label>
                    Design code *
                    <input
                      value={draft.code}
                      maxLength={60}
                      onChange={(e) => patch("code", e.target.value)}
                      placeholder="e.g. TC-2001"
                    />
                    <small>Unique across your library.</small>
                  </label>
                  <label>
                    Collection *
                    <input
                      list="collection-options"
                      value={draft.collection}
                      maxLength={80}
                      onChange={(e) => patch("collection", e.target.value)}
                      placeholder="Choose or type a collection"
                    />
                    <datalist id="collection-options">
                      {collections.map((c) => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </label>
                  <label>
                    Status
                    <select
                      value={draft.status}
                      onChange={(e) =>
                        patch("status", e.target.value as Product["status"])
                      }
                    >
                      <option>Draft</option>
                      <option>Active</option>
                      <option>Archived</option>
                    </select>
                  </label>
                  <label>
                    Tags
                    <input
                      value={tags}
                      maxLength={1000}
                      onChange={(e) => {
                        setTags(e.target.value);
                        setDirty(true);
                      }}
                      placeholder="New arrival, Bookmatch"
                    />
                    <small>Separate tags with commas.</small>
                  </label>
                  <label>
                    Colours
                    <input
                      value={colours}
                      maxLength={1000}
                      onChange={(e) => {
                        setColours(e.target.value);
                        setDirty(true);
                      }}
                      placeholder="Ivory, Grey"
                    />
                    <small>Use colour names, separated by commas.</small>
                  </label>
                  <label className="full-width">
                    Description
                    <textarea
                      rows={4}
                      value={draft.description}
                      maxLength={3000}
                      onChange={(e) => patch("description", e.target.value)}
                      placeholder="Describe the material, finish and intended use."
                    />
                  </label>
                </div>
                <div className="flag-fields">
                  <label>
                    <input
                      type="checkbox"
                      checked={draft.showInPdf}
                      onChange={(e) => patch("showInPdf", e.target.checked)}
                    />
                    <span>
                      Show in PDF
                      <small>
                        Mark for inclusion in future catalogue builds.
                      </small>
                    </span>
                  </label>
                  <label>
                    <input
                      type="checkbox"
                      checked={draft.private}
                      onChange={(e) => patch("private", e.target.checked)}
                    />
                    <span>
                      Private
                      <small>
                        Saved visibility preference. Sharing is not enabled yet.
                      </small>
                    </span>
                  </label>
                </div>
              </div>
            )}
            {tab === "Variants" && (
              <div
                role="tabpanel"
                id="editor-Variants"
                aria-labelledby="tab-Variants"
              >
                <p className="muted">
                  Keep each size, finish and thickness as a separate variant.
                  All dimensions are in millimetres.
                </p>
                {draft.variants.map((v, i) => (
                  <section className="variant-card" key={v.id}>
                    <div className="section-row">
                      <h3>Variant {i + 1}</h3>
                      <Button
                        type="button"
                        aria-label={`Remove variant ${i + 1}`}
                        className="icon-button"
                        disabled={draft.variants.length === 1}
                        onClick={() =>
                          patch(
                            "variants",
                            draft.variants.filter((x) => x.id !== v.id),
                          )
                        }
                      >
                        <Trash2 size={15} />
                      </Button>
                    </div>
                    <div className="form-grid three">
                      <label>
                        Width (mm)
                        <input
                          aria-label={`Variant ${i + 1} width`}
                          type="number"
                          min="1"
                          max="10000"
                          step="any"
                          value={v.widthMm || ""}
                          onChange={(e) =>
                            variant(v.id, { widthMm: Number(e.target.value) })
                          }
                        />
                      </label>
                      <label>
                        Height (mm)
                        <input
                          aria-label={`Variant ${i + 1} height`}
                          type="number"
                          min="1"
                          max="10000"
                          step="any"
                          value={v.heightMm || ""}
                          onChange={(e) =>
                            variant(v.id, { heightMm: Number(e.target.value) })
                          }
                        />
                      </label>
                      <label>
                        Thickness (mm)
                        <input
                          aria-label={`Variant ${i + 1} thickness`}
                          type="number"
                          min="0.1"
                          max="100"
                          step="any"
                          value={v.thicknessMm || ""}
                          onChange={(e) =>
                            variant(v.id, {
                              thicknessMm: Number(e.target.value),
                            })
                          }
                        />
                      </label>
                      <label>
                        Surface
                        <select
                          aria-label={`Variant ${i + 1} surface`}
                          value={v.surface}
                          onChange={(e) =>
                            variant(v.id, {
                              surface: e.target
                                .value as TechnicalVariant["surface"],
                            })
                          }
                        >
                          <option>Matt</option>
                          <option>Polished</option>
                          <option>Satin</option>
                        </select>
                      </label>
                      <label>
                        Body
                        <select
                          aria-label={`Variant ${i + 1} body`}
                          value={v.body}
                          onChange={(e) =>
                            variant(v.id, {
                              body: e.target.value as TechnicalVariant["body"],
                            })
                          }
                        >
                          <option>Porcelain</option>
                          <option>Ceramic</option>
                          <option>Full body</option>
                        </select>
                      </label>
                    </div>
                  </section>
                ))}
                <Button
                  type="button"
                  disabled={draft.variants.length >= 20}
                  onClick={() =>
                    patch("variants", [
                      ...draft.variants,
                      {
                        id: crypto.randomUUID(),
                        widthMm: 600,
                        heightMm: 600,
                        thicknessMm: 9,
                        surface: "Matt",
                        body: "Porcelain",
                      },
                    ])
                  }
                >
                  <Plus size={15} /> Add variant
                </Button>
              </div>
            )}
            {tab === "Media" && (
              <div
                role="tabpanel"
                id="editor-Media"
                aria-labelledby="tab-Media"
              >
                <div className="upload-bar">
                  <label>
                    Media role
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as MediaRole)}
                    >
                      <option value="tile-face">Tile face</option>
                      <option value="room-preview">Room preview</option>
                      <option value="closeup">Closeup</option>
                    </select>
                  </label>
                  <label className="upload-input">
                    <Upload size={17} />
                    <span>Add images</span>
                    <input
                      type="file"
                      aria-label="Upload product images"
                      accept="image/png,image/jpeg,image/webp"
                      multiple
                      onChange={(e) => {
                        void upload(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                <p className="asset-note">
                  PNG, JPEG or WebP · Up to 10 MB each. Originals retain their
                  colours. Images are stored locally; save the product to attach
                  them.
                </p>
                {uploading && <p role="status">Uploading images…</p>}
                {!allMedia.length && (
                  <div className="media-empty">
                    No images yet. Add tile faces, room previews or closeups
                    above.
                  </div>
                )}
                <div className="editable-media-grid">
                  {allMedia.map((a, i) => (
                    <article key={a.id}>
                      <Image
                        src={a.previewUrl}
                        width={220}
                        height={150}
                        alt={a.alt}
                        unoptimized
                      />
                      <div className="section-row">
                        <small>
                          {a.role === "tile-face"
                            ? "Tile face"
                            : a.role === "room-preview"
                              ? "Room preview"
                              : "Closeup"}
                        </small>
                        <Button
                          type="button"
                          className="icon-button"
                          aria-label={`Remove image ${i + 1}`}
                          onClick={() => {
                            const k =
                              a.role === "tile-face" ? "faces" : "media";
                            patch(
                              k,
                              draft[k].filter((x) => x.id !== a.id),
                            );
                          }}
                        >
                          <Trash2 size={14} />
                        </Button>
                      </div>
                      <label>
                        Image description
                        <input
                          value={a.alt}
                          maxLength={200}
                          onChange={(e) => {
                            const k =
                              a.role === "tile-face" ? "faces" : "media";
                            patch(
                              k,
                              draft[k].map((x) =>
                                x.id === a.id
                                  ? { ...x, alt: e.target.value }
                                  : x,
                              ),
                            );
                          }}
                        />
                      </label>
                      {a.role === "tile-face" && draft.faces[0].id !== a.id && (
                        <Button
                          type="button"
                          onClick={() =>
                            patch("faces", [
                              a,
                              ...draft.faces.filter((x) => x.id !== a.id),
                            ])
                          }
                        >
                          Set as cover
                        </Button>
                      )}
                      {a.role === "tile-face" && draft.faces[0].id === a.id && (
                        <span className="badge">Cover image</span>
                      )}
                    </article>
                  ))}
                </div>
              </div>
            )}
          </fieldset>
        </div>
        <div className="modal-actions">
          <span>
            {dirty ? "Unsaved changes" : "All fields marked * are required"}
          </span>
          <Button type="button" onClick={close} disabled={busy || uploading}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="primary"
            disabled={busy || uploading}
          >
            {busy ? "Saving…" : "Save product"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
