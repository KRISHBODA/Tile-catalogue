import { readFile } from "node:fs/promises";
import path from "node:path";
import { dataDirectory } from "@/features/products/repository";
import { checkLocalRequest, apiError } from "@/features/products/local-api";
export const runtime = "nodejs";
export async function GET(
  request: Request,
  { params }: { params: Promise<{ filename: string }> },
) {
  try {
    checkLocalRequest(request);
    const { filename } = await params;
    if (!/^[a-f0-9-]{36}\.(png|jpg|webp)$/.test(filename))
      return new Response("Not found", { status: 404 });
    let bytes;
    try {
      bytes = await readFile(path.join(dataDirectory(), "media", filename));
    } catch {
      return new Response("Not found", { status: 404 });
    }
    const extension = filename.split(".").pop();
    return new Response(bytes, {
      headers: {
        "Content-Type":
          extension === "jpg" ? "image/jpeg" : `image/${extension}`,
        "X-Content-Type-Options": "nosniff",
        "Cache-Control": "private, max-age=31536000, immutable",
        "Content-Security-Policy": "default-src 'none'",
      },
    });
  } catch (e) {
    return apiError(e);
  }
}
