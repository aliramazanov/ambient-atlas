import { test } from "node:test";
import assert from "node:assert/strict";
import { severityOf, researchOf, dots } from "../../src/lib/data/scales/severity.ts";
import { anthroSubOf } from "../../src/lib/data/scales/anthropogenic.ts";

test("severityOf prefers an explicit value", () => {
  assert.equal(severityOf({ severity: 5 } as never), 5);
});

test("severityOf falls back to category then tier", () => {
  assert.equal(severityOf({ category: "fiber" } as never), 5);
  assert.equal(severityOf({ tier: "conflict" } as never), 5);
});

test("researchOf derives from certainty", () => {
  assert.equal(researchOf({ certainty: "established" } as never), 5);
  assert.equal(researchOf({ certainty: "anecdotal" } as never), 1);
});

test("dots renders filled and empty pips", () => {
  assert.equal(dots(3), "●●●○○");
  assert.equal(dots(0), "○○○○○");
});

test("anthroSubOf classifies by keywords", () => {
  assert.equal(
    anthroSubOf({ id: "t1", name: "Zinc smelter", desc: "lead smelting", tier: "anthropogenic" } as never),
    "mining",
  );
  assert.equal(
    anthroSubOf({ id: "t2", name: "Uranium tailings", desc: "uranium waste", tier: "anthropogenic" } as never),
    "nuclear",
  );
  assert.equal(
    anthroSubOf({ id: "t3", name: "E-waste dump", desc: "open burning of e-waste", tier: "anthropogenic" } as never),
    "waste",
  );
});
