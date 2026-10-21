import { APP_CONFIG, APP_ROUTES } from "@/constants";

export const app = {
  name: APP_CONFIG.NAME,
  workspace: APP_CONFIG.WORKSPACE,
};

export const navigation = [
  { href: APP_ROUTES.PRODUCTS, label: "Product Manager", icon: "products" },
  { href: APP_ROUTES.CATALOGUES.BUILDER, label: "Catalogue Builder", icon: "builder" },
  { href: APP_ROUTES.CATALOGUES.HISTORY, label: "Catalogue History", icon: "history" },
] as const;
