"use client";
import { useSyncExternalStore } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/primitives";
export const columns = [
  ["tile", "Tile image"],
  ["room", "Room preview"],
  ["size", "Size"],
  ["collection", "Collection"],
  ["surface", "Surface"],
  ["thickness", "Thickness"],
  ["faces", "Face count"],
  ["status", "Status"],
  ["tags", "Tags"],
  ["colours", "Colours"],
  ["body", "Body"],
  ["pdf", "Show in PDF"],
  ["private", "Private"],
] as const;
export type Column = (typeof columns)[number][0];
const defaults: Column[] = [
  "tile",
  "room",
  "size",
  "collection",
  "surface",
  "thickness",
  "faces",
  "status",
];
const key = "tile-catalogue:columns:v1";
const initial = JSON.stringify(defaults);
function snapshot() {
  try {
    return localStorage.getItem(key) || initial;
  } catch {
    return initial;
  }
}
function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("tile-columns", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("tile-columns", callback);
  };
}
export function useColumns() {
  const raw = useSyncExternalStore(subscribe, snapshot, () => initial);
  let visible: Column[] = defaults;
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed))
      visible = parsed.filter((v): v is Column =>
        columns.some(([k]) => k === v),
      );
  } catch {}
  function set(value: Column[]) {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      window.dispatchEvent(new Event("tile-columns"));
    } catch {
      window.alert(
        "Column preferences could not be saved. Check your browser storage settings.",
      );
    }
  }
  return { visible, set, defaults };
}
export function ColumnPicker({
  visible,
  onChange,
  onClose,
}: {
  visible: Column[];
  onChange: (columns: Column[]) => void;
  onClose: () => void;
}) {
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
