import assert from "node:assert/strict";
import { test } from "node:test";
import { summarize } from "../../src/lib/seo/describe.ts";
import { zones } from "../../src/lib/data/zones/zones.ts";

const MAX = 155;

test("summarize keeps a short first sentence whole", () => {
  assert.equal(summarize("A short lead. And more after it."), "A short lead.");
});

test("summarize collapses whitespace", () => {
  assert.equal(summarize("Spread   over\n\nlines."), "Spread over lines.");
});

test("summarize truncates on a word boundary within the limit", () => {
  const long = `${"word ".repeat(60)}end.`;
  const out = summarize(long);
  assert.ok(out.length <= MAX, `got ${out.length}`);
  assert.ok(out.endsWith("…"));
  assert.ok(!out.includes("  "));
});

test("every zone description yields a usable meta description", () => {
  const bad = zones
    .map((z) => ({ id: z.id, d: summarize(z.desc) }))
    .filter(({ d }) => d.length === 0 || d.length > MAX);
  assert.deepEqual(bad, []);
});
