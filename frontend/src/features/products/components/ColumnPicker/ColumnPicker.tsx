"use client";

import { Modal } from "@/components/common/Modal";
import { Button } from "@/components/common/Button";
import { Column, columns } from "../../hooks/useColumns";

export function ColumnPicker({
  visible,
  onChange,
  onClose,
}: {
  visible: Column[];
  onChange: (columns: Column[]) => void;
  onClose: () => void;
}) {
  const defaults = [
    "tile",
    "room",
    "size",
    "collection",
    "surface",
    "thickness",
    "faces",
    "status",
    "360",
  ] as Column[];

  return (
    <Modal title="Table columns" onClose={onClose}>
      <div className="modal-body">
        <p>
          Choose what appears in your product table. Design name and actions are
          always shown.
        </p>
        <div className="column-options">
          {columns.map(([key, label]) => (
            <label key={key}>
              <input
                type="checkbox"
                checked={visible.includes(key)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...visible, key]
                      : visible.filter((c) => c !== key),
                  )
                }
              />
              {label}
            </label>
          ))}
        </div>
      </div>
      <div className="modal-actions">
        <Button onClick={() => onChange(defaults)}>Reset columns</Button>
        <Button className="primary" onClick={onClose}>
          Done
        </Button>
      </div>
    </Modal>
  );
}
