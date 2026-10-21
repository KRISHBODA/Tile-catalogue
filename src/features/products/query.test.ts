import { test } from "node:test";
import assert from "node:assert/strict";
import { readQuery, queryProducts } from "./query.ts";
import { sampleProducts as products } from "./sample-data.ts";
const run = (s: string) =>
  queryProducts(products, readQuery(new URLSearchParams(s)));
test("search supports design names and codes", () => {
  assert.equal(run("q=calacatta").filtered[0].code, "TC-1001");
  assert.equal(run("q=TC-1002").filtered[0].name, "Pietra Grey");
});
test("filters combine and variant filters match the same variant", () => {
  const result = run(
    "collection=Marble&surface=Matt&size=600x600&status=Active",
  );
  assert.ok(result.filtered.length > 0);
  assert.ok(
    result.filtered.every(
      (p) =>
        p.collection === "Marble" &&
        p.status === "Active" &&
        p.variants.some(
          (v) =>
            v.surface === "Matt" && v.widthMm === 600 && v.heightMm === 600,
        ),
    ),
  );
  assert.equal(run("size=1200x2400&surface=Matt").filtered.length, 0);
});
test("pagination clamps and sort reverses", () => {
  assert.equal(run("").visible.length, 8);
  assert.equal(run("page=2").visible.length, 8);
  assert.equal(run("page=999").page, 3);
  assert.equal(run("page=-1").page, 1);
  assert.deepEqual(
    run("sort=desc").filtered.map((p) => p.id),
    run("")
      .filtered.map((p) => p.id)
      .reverse(),
  );
});
test("empty results are valid", () => {
  const result = run("q=not-a-product");
  assert.equal(result.visible.length, 0);
  assert.equal(result.pages, 1);
});

test("advanced filters combine metadata and same-variant specifications", () => {
  const result = run(
    "tag=New+arrival&colour=Ivory&pdf=yes&privacy=no&body=Porcelain&thickness=9&preview=no",
  );
  assert.ok(result.filtered.length > 0);
  assert.ok(
    result.filtered.every(
      (p) =>
        p.tags.includes("New arrival") &&
        p.colours.includes("Ivory") &&
        p.showInPdf &&
        !p.private &&
        p.variants.some((v) => v.body === "Porcelain" && v.thicknessMm === 9),
    ),
  );
  assert.equal(run("preview=yes").filtered.length, 0);
});
