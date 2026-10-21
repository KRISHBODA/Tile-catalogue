import {
  bulkUpdate,
  duplicateProduct,
  listProducts,
  saveProduct,
} from "@/features/products/repository";
import { apiError, checkLocalRequest } from "@/features/products/local-api";
import { ProductError } from "@/features/products/validation";
export const runtime = "nodejs";
export async function GET(request: Request) {
  try {
    checkLocalRequest(request);
    return Response.json(
      { products: await listProducts() },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch (e) {
    return apiError(e);
  }
}
export async function POST(request: Request) {
  try {
    checkLocalRequest(request, true);
    const raw = await request.text();
    if (raw.length > 1024 * 1024)
      throw new ProductError("Product data is too large.", 413);
    let body;
    try {
      body = JSON.parse(raw);
    } catch {
      throw new ProductError("Invalid request.");
    }
    if (!body || typeof body !== "object")
      throw new ProductError("Invalid request.");
    let product;
    switch (body.operation) {
      case "create":
        product = await saveProduct(body.data);
        break;
      case "update":
        if (!body.target)
          throw new ProductError(
            "A product identifier and revision are required.",
          );
        product = await saveProduct(body.data, body.target);
        break;
      case "duplicate":
        product = await duplicateProduct(body.target);
        break;
      case "bulk":
        await bulkUpdate(body.targets, body.changes);
        break;
      default:
        throw new ProductError("Unknown operation.");
    }
    return Response.json({ products: await listProducts(), product });
  } catch (e) {
    return apiError(e);
  }
}
