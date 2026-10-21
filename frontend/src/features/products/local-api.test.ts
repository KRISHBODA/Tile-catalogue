import { test } from "node:test";
import assert from "node:assert/strict";
import { checkLocalRequest } from "./local-api.ts";
test("local mutations use the browser Host despite Next's internal URL", () => {
  const request = (host: string, origin: string) =>
    new Request("http://localhost:3000/api/products", {
      headers: { host, origin },
    });
  assert.doesNotThrow(() =>
    checkLocalRequest(request("127.0.0.1:3000", "http://127.0.0.1:3000"), true),
  );
  assert.throws(() =>
    checkLocalRequest(request("127.0.0.1:3000", "https://example.com"), true),
  );
  assert.throws(() =>
    checkLocalRequest(
      request("example.com:3000", "http://example.com:3000"),
      true,
    ),
  );
  assert.throws(() =>
    checkLocalRequest(request("127.0.0.1:3000", "http://127.0.0.1:3001"), true),
  );
});
