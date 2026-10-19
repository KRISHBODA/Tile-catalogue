export const app = { name: "Tile Catalogue", workspace: "Studio workspace" };
export const navigation = [
  { href: "/products", label: "Product Manager", icon: "products" },
  { href: "/catalogues/builder", label: "Catalogue Builder", icon: "builder" },
  { href: "/catalogues/history", label: "Catalogue History", icon: "history" },
] as const;
