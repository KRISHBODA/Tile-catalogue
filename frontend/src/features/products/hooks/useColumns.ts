"use client";

import { useSyncExternalStore } from "react";

export const columns = [
  ["tile", "Tile image"],
  ["room", "Preview"],
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
  ["360", "360"],
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
  "360",
];

const key = "tile-catalogue:columns:v2";
const initial = JSON.stringify(defaults);

function snapshot() {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return saved;
    const previous = localStorage.getItem("tile-catalogue:columns:v1");
    if (previous) {
      const parsed = JSON.parse(previous);
      if (Array.isArray(parsed)) return JSON.stringify([...new Set([...parsed, "360"])]);
    }
    return initial;
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
