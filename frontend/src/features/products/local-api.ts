import { ProductError } from "./validation.ts";
export function checkLocalRequest(request: Request, mutation = false) {
  const url = new URL(request.url);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(url.hostname))
    throw new ProductError(
      "This development workspace is available locally only.",
      403,
    );
  const host = request.headers.get("host") ?? url.host;
  const publicOrigin = new URL(`${url.protocol}//${host}`);
  if (!["localhost", "127.0.0.1", "[::1]"].includes(publicOrigin.hostname))
    throw new ProductError("This workspace is available locally only.", 403);
  if (mutation && request.headers.get("origin") !== publicOrigin.origin)
    throw new ProductError(
      "Open this workspace locally before making changes.",
      403,
    );
}
export function apiError(error: unknown) {
  if (error instanceof ProductError)
    return Response.json({ error: error.message }, { status: error.status });
  console.error("Product operation failed", error);
  return Response.json(
    {
      error:
        "The operation could not be completed. Refresh the library before trying again.",
    },
    { status: 500 },
  );
}
