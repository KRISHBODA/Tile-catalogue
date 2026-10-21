import { Suspense } from "react";
import { ProductManager, sampleProducts } from "@/features/products";

export const dynamic = "force-dynamic";

export default function Products() {
  return (
    <Suspense fallback={<p>Loading product library…</p>}>
      <ProductManager initialProducts={sampleProducts} />
    </Suspense>
  );
}
