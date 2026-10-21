"use client";
import { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/primitives";
import type { BulkChanges, Product } from "./types";
export function BulkEditor({
  products,
  onClose,
  onSave,
}: {
  products: Product[];
  onClose: () => void;
  onSave: (changes: BulkChanges) => Promise<void>;
}) {
  const [status, setStatus] = useState("");
  const [pdf, setPdf] = useState("");
  const [privateValue, setPrivate] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <Modal title="Bulk edit products" onClose={onClose} busy={busy}>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          setError("");
          try {
            const changes: BulkChanges = {};
            if (status) changes.status = status as Product["status"];
            if (pdf) changes.showInPdf = pdf === "yes";
            if (privateValue) changes.private = privateValue === "yes";
            await onSave(changes);
          } catch (e) {
            setError(e instanceof Error ? e.message : "Update failed.");
          } finally {
            setBusy(false);
          }
        }}
      >
        <div className="modal-body">
          <p>
            Apply these changes to{" "}
            <strong>{products.length} selected products</strong> on this page.
          </p>
          <ul className="bulk-names">
            {products.map((p) => (
              <li key={p.id}>
                {p.name} <small>{p.code}</small>
              </li>
            ))}
          </ul>
          {error && (
            <div role="alert" className="form-error">
              {error}
            </div>
          )}
          <fieldset disabled={busy} className="form-grid">
            <label>
              Status
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
              >
                <option value="">Keep existing</option>
                <option>Active</option>
                <option>Draft</option>
                <option>Archived</option>
              </select>
            </label>
            <label>
              Show in PDF
              <select value={pdf} onChange={(e) => setPdf(e.target.value)}>
                <option value="">Keep existing</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
            <label>
              Private
              <select
                value={privateValue}
                onChange={(e) => setPrivate(e.target.value)}
              >
                <option value="">Keep existing</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </label>
          </fieldset>
          <p className="asset-note">
            Archiving preserves products and images. Change the status back to
            Active to restore them.
          </p>
        </div>
        <div className="modal-actions">
          <Button type="button" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button
            type="submit"
            className="primary"
            disabled={busy || (!status && !pdf && !privateValue)}
          >
            {busy ? "Applying…" : `Apply to ${products.length} products`}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
