import type { Product } from "./types";
const names = [
  "Calacatta Ivory",
  "Pietra Grey",
  "Travertine Sand",
  "Statuario Bianco",
  "Basalt Charcoal",
  "Onyx Pearl",
  "Concrete Ash",
  "Sahara Beige",
  "Carrara Classic",
  "Limestone Fog",
  "Terrazzo Cloud",
  "Nordic Oak",
  "Marquina Nero",
  "Arabescato White",
  "Slate Graphite",
  "Dune Natural",
  "Ceppo Stone",
  "Alpine Mist",
  "Cotto Earth",
  "Silver Travertine",
];
const collections = ["Marble", "Stone", "Concrete", "Wood"];
export const sampleProducts: Product[] = names.map((name, i) => {
  const tone = i % 6;
  const asset = (n: number) => ({
    id: `face-${i}-${n}`,
    role: "tile-face" as const,
    previewUrl: `/samples/tile-${tone}.svg`,
    originalUrl: null,
    alt: `${name}, illustrative sample face ${n + 1}`,
  });
  return {
    id: `design-${i + 1}`,
    revision: 1,
    updatedAt: "2026-10-19T00:00:00.000Z",
    isSample: true,
    description:
      "Illustrative sample design. Replace sample faces with your own product photographs.",
    tags: i % 3 === 0 ? ["New arrival"] : [],
    colours: [i % 2 ? "Grey" : "Ivory"],
    name,
    code: `TC-${String(1001 + i)}`,
    collection: collections[i === 11 ? 3 : i % 3],
    status: i % 7 === 4 ? "Draft" : i % 9 === 6 ? "Archived" : "Active",
    showInPdf: i % 7 !== 4,
    private: false,
    variants: [
      {
        id: `variant-${i}`,
        widthMm: i % 3 === 0 ? 600 : 1200,
        heightMm: i % 3 === 0 ? 600 : i % 2 ? 2400 : 1200,
        thicknessMm: i % 3 === 0 ? 9 : 9.5,
        surface: i % 3 === 0 ? "Matt" : i % 3 === 1 ? "Polished" : "Satin",
        body: "Porcelain",
      },
      ...(i % 4 === 0
        ? [
            {
              id: `variant-${i}-b`,
              widthMm: 600,
              heightMm: 1200,
              thicknessMm: 9,
              surface: "Matt" as const,
              body: "Porcelain" as const,
            },
          ]
        : []),
    ],
    faces: Array.from({ length: 3 + (i % 4) }, (_, n) => asset(n)),
    media: [],
  };
});
