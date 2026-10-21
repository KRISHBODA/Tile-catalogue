import { Suspense } from "react";
import { listProducts } from "@/features/products/repository";
import { ProductManager } from "@/features/products/product-manager";
export const dynamic = "force-dynamic";
export default async function Products() {
  const products = await listProducts();
  return (
    <Suspense fallback={<p>Loading product library…</p>}>
      <ProductManager products={products} />
    </Suspense>
  );
}
