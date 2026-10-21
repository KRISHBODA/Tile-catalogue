import { test, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import {
  bulkUpdate,
  duplicateProduct,
  listProducts,
  saveProduct,
} from "./repository.ts";
import { sampleProducts } from "./sample-data.ts";
import { validateProduct } from "./validation.ts";
import { imageExtension } from "./image-upload.ts";
import { productsCsv } from "./export.ts";
const folder = await mkdtemp(path.join(tmpdir(), "tile-store-test-"));
process.env.TILE_DATA_DIR = folder;
after(async () => {
  await rm(folder, { recursive: true, force: true });
});
test("store persists products, enforces unique codes, and rejects stale edits", async () => {
  const input = validateProduct({
    ...sampleProducts[0],
    code: "TEST-001",
    name: "Test design",
    faces: [],
  });
  const created = await saveProduct(input);
  assert.equal(created.isSample, false);
  assert.equal(created.revision, 1);
  assert.equal(
    (await listProducts()).find((p) => p.id === created.id)?.name,
    "Test design",
  );
  await assert.rejects(
    () => saveProduct({ ...input, code: "test-001" }),
    /already in use/,
  );
  const updated = await saveProduct(
    { ...input, name: "Edited design" },
    created,
  );
  assert.equal(updated.revision, 2);
  await assert.rejects(
    () => saveProduct({ ...input, name: "Stale" }, created),
    /changed in another tab/,
  );
  assert.equal(
    (await listProducts()).find((p) => p.id === created.id)?.name,
    "Edited design",
  );
  const copy = await duplicateProduct(updated);
  assert.equal(copy.status, "Draft");
  assert.notEqual(copy.code, created.code);
  assert.equal(copy.showInPdf, false);
  // A stale member causes the entire batch to roll back, including earlier valid members.
  await assert.rejects(
    () => bulkUpdate([copy, created], { status: "Archived" }),
    /changed in another tab/,
  );
  assert.equal(
    (await listProducts()).find((p) => p.id === copy.id)?.status,
    "Draft",
  );
  const result = await bulkUpdate([copy, updated], {
    status: "Archived",
    private: true,
  });
  assert.ok(result.every((p) => p.status === "Archived" && p.private));
  const restored = await bulkUpdate(result, { status: "Active" });
  assert.ok(restored.every((p) => p.status === "Active"));
  assert.equal((await listProducts()).length, 22);
});
test("validation rejects invalid dimensions, duplicate variants, booleans and external media", () => {
  assert.throws(
    () => validateProduct({ ...sampleProducts[0], name: " " }),
    /required/,
  );
  assert.throws(
    () => validateProduct({ ...sampleProducts[0], showInPdf: "true" }),
    /yes or no/,
  );
  assert.throws(
    () =>
      validateProduct({
        ...sampleProducts[0],
        variants: [{ ...sampleProducts[0].variants[0], widthMm: -1 }],
      }),
    /Width/,
  );
  assert.throws(
    () =>
      validateProduct({
        ...sampleProducts[0],
        variants: [
          sampleProducts[0].variants[0],
          { ...sampleProducts[0].variants[0], id: "second" },
        ],
      }),
    /identical/,
  );
  assert.throws(
    () =>
      validateProduct({
        ...sampleProducts[0],
        faces: [
          {
            ...sampleProducts[0].faces[0],
            previewUrl: "https://example.com/image.jpg",
          },
        ],
      }),
    /uploaded image/,
  );
});
test("CSV includes all variants and neutralizes spreadsheet formulas", () => {
  const p = {
    ...sampleProducts[0],
    name: "=SUM(1,2)",
    description: 'quote " and\nline',
  };
  const csv = productsCsv([p]);
  assert.ok(csv.includes('"\'=SUM(1,2)"'));
  assert.ok(csv.includes('quote "" and\nline'));
  assert.equal(csv.split("\r\n").length, p.variants.length + 1);
});
test("uploads reject non-image bytes and recognize supported formats", () => {
  assert.throws(
    () => imageExtension(Buffer.from("<svg></svg>")),
    /PNG, JPEG or WebP/,
  );
  assert.equal(imageExtension(Buffer.from([255, 216, 255, 224])), "jpg");
  assert.equal(
    imageExtension(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10, 0, 0, 0, 0])),
    "png",
  );
  assert.equal(imageExtension(Buffer.from("RIFFxxxxWEBP")), "webp");
});

test("new designs retain uploaded previews separately from tile faces", async () => {
  const filename = "11111111-1111-4111-8111-111111111111.png";
  await mkdir(path.join(folder, "media"), { recursive: true });
  await writeFile(
    path.join(folder, "media", filename),
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  );
  const preview = {
    id: "preview-test",
    role: "room-preview",
    previewUrl: `/api/media/${filename}`,
    originalUrl: `/api/media/${filename}`,
    alt: "Uploaded preview",
  };
  const created = await saveProduct({
    ...sampleProducts[0],
    code: "TEST-PREVIEW",
    media: [preview],
  });
  const saved = (await listProducts()).find((p) => p.id === created.id)!;
  assert.equal(saved.media[0].role, "room-preview");
  assert.equal(saved.media[0].previewUrl, preview.previewUrl);
  assert.equal(saved.faces.length, sampleProducts[0].faces.length);
  const updated = await saveProduct(
    { ...saved, name: "Preview remains attached" },
    created,
  );
  assert.deepEqual(updated.media, saved.media);
});

test("360 is a saved yes/no preference and defaults to no for older designs", async () => {
  const { has360: omitted, ...legacy } = sampleProducts[0];
  void omitted;
  assert.equal(validateProduct(legacy).has360, false);
  assert.throws(() => validateProduct({ ...legacy, has360: "yes" }), /yes or no/);
  const created = await saveProduct({ ...legacy, code: "TEST-360", has360: true });
  assert.equal((await listProducts()).find((p) => p.id === created.id)?.has360, true);
  const edited = await saveProduct({ ...created, has360: false }, created);
  assert.equal(edited.has360, false);
});
