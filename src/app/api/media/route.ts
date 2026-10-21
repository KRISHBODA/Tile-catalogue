import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { dataDirectory } from "@/features/products/repository";
import { apiError, checkLocalRequest } from "@/features/products/local-api";
import { ProductError } from "@/features/products/validation";
import { imageExtension } from "@/features/products/image-upload";
export const runtime = "nodejs";
export async function POST(request: Request) {
  try {
    checkLocalRequest(request, true);
    if (Number(request.headers.get("content-length")) > 11 * 1024 * 1024)
      throw new ProductError("Images must be 10 MB or smaller.", 413);
    const data = await request.formData();
    const file = data.get("file");
    if (!(file instanceof File) || file.size === 0)
      throw new ProductError("Choose an image to upload.");
    if (file.size > 10 * 1024 * 1024)
      throw new ProductError("Images must be 10 MB or smaller.", 413);
    const bytes = Buffer.from(await file.arrayBuffer());
    const extension = imageExtension(bytes);
    const id = randomUUID(),
      filename = `${id}.${extension}`;
    await mkdir(path.join(dataDirectory(), "media"), { recursive: true });
    await writeFile(path.join(dataDirectory(), "media", filename), bytes, {
      flag: "wx",
    });
    return Response.json({
      id,
      url: `/api/media/${filename}`,
      name: file.name.slice(0, 200),
    });
  } catch (e) {
    return apiError(e);
  }
}
