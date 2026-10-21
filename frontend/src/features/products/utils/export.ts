import type { Product } from "../types";

export function csvCell(value: unknown) {
  let text = String(value ?? "");
  if (/^[\s]*[=+@\-]/.test(text) || /^[\t\r\n]/.test(text)) text = "'" + text;
  return '"' + text.replaceAll('"', '""') + '"';
}

export function productsCsv(products: Product[]) {
  const rows: unknown[][] = [
    [
      "Design name",
      "Code",
      "Collection",
      "Status",
      "Width (mm)",
      "Height (mm)",
      "Thickness (mm)",
      "Surface",
      "Body",
      "Faces",
      "Tags",
      "Colours",
      "Show in PDF",
      "Private",
      "Description",
      "360",
    ],
  ];
  for (const p of products)
    for (const v of p.variants)
      rows.push([
        p.name,
        p.code,
        p.collection,
        p.status,
        v.widthMm,
        v.heightMm,
        v.thicknessMm,
        v.surface,
        v.body,
        p.faces.length,
        p.tags.join("; "),
        p.colours.join("; "),
        p.showInPdf ? "Yes" : "No",
        p.private ? "Yes" : "No",
        p.description,
        p.has360 ? "Yes" : "No",
      ]);
  return "\uFEFF" + rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
}

export function downloadCsv(products: Product[]) {
  const blob = new Blob([productsCsv(products)], {
    type: "text/csv;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "tile-catalogue-products.csv";
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
