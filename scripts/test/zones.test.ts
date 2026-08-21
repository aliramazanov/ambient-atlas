import assert from "node:assert/strict";
import { createRequire } from "node:module";
import { test } from "node:test";
import { geoContains } from "d3-geo";
import { feature } from "topojson-client";
import { resolveUrl } from "../check/lib.ts";
import { CATEGORIES } from "../../src/lib/data/scales/categories.ts";
import { zones } from "../../src/lib/data/zones/zones.ts";
import {
  MARINE_ZONES,
  NEAR_PAIRS,
  SIMILAR_NAME_PAIRS,
} from "./fixtures/known-clusters.ts";

const DUPLICATE_KM = 3;
const SIMILAR_NAME_KM = 60;
const SIMILAR_NAME_SCORE = 0.5;
const OFFSHORE_KM = 25;
const MAX_REACH_KM = 3000;

const TIER_OF_CATEGORY = new Map(CATEGORIES.map((c) => [c.key, c.tier]));

const NAME_STOPWORDS = new Set([
  "lake", "the", "of", "and", "valley", "river", "mine", "mining", "bay",
  "city", "region", "area", "site", "field", "north", "south", "east", "west",
  "upper", "lower",
]);

function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number,
): number {
  const rad = Math.PI / 180;
  const dLat = (lat2 - lat1) * rad;
  const dLng = (lng2 - lng1) * rad;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * rad) * Math.cos(lat2 * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

function nameTokens(name: string): Set<string> {
  return new Set(
    name
      .toLowerCase()
      .split(/[^a-z0-9]+/)
      .filter((t) => t.length > 2 && !NAME_STOPWORDS.has(t)),
  );
}

function similarity(a: Set<string>, b: Set<string>): number {
  if (!a.size || !b.size) return 0;
  let shared = 0;
  for (const t of a) if (b.has(t)) shared++;
  return shared / (a.size + b.size - shared);
}

function allowed(
  exceptions: readonly (readonly [string, string, string])[],
  a: string,
  b: string,
): boolean {
  return exceptions.some(
    ([x, y]) => (x === a && y === b) || (x === b && y === a),
  );
}

function pairsWithin(km: number): [string, string, number][] {
  const out: [string, string, number][] = [];
  for (let i = 0; i < zones.length; i++)
    for (let j = i + 1; j < zones.length; j++) {
      const d = distanceKm(
        zones[i].lat,
        zones[i].lng,
        zones[j].lat,
        zones[j].lng,
      );
      if (d <= km) out.push([zones[i].id, zones[j].id, d]);
    }
  return out;
}

test("zone ids are unique", () => {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  for (const z of zones) {
    if (seen.has(z.id)) duplicates.push(z.id);
    seen.add(z.id);
  }
  assert.deepEqual(duplicates, []);
});

test("coordinates are in range and never null island", () => {
  const bad = zones
    .filter(
      (z) =>
        !(z.lat >= -90 && z.lat <= 90) ||
        !(z.lng >= -180 && z.lng <= 180) ||
        (z.lat === 0 && z.lng === 0),
    )
    .map((z) => `${z.id} (${z.lat}, ${z.lng})`);
  assert.deepEqual(bad, []);
});

test("category belongs to the zone's tier", () => {
  const bad = zones
    .filter((z) => TIER_OF_CATEGORY.get(z.category) !== z.tier)
    .map((z) => `${z.id} (tier=${z.tier} category=${z.category})`);
  assert.deepEqual(bad, []);
});

test("name and desc are present", () => {
  const bad: string[] = [];
  for (const z of zones) {
    if (!z.name?.trim()) bad.push(`${z.id}: name`);
    if (!z.desc?.trim()) bad.push(`${z.id}: desc`);
  }
  assert.deepEqual(bad, []);
});

test("prose carries no em or en dashes", () => {
  const bad: string[] = [];
  for (const z of zones)
    for (const field of ["name", "desc", "health"] as const) {
      const value = z[field];
      if (typeof value === "string" && /[\u2013\u2014]/.test(value))
        bad.push(`${z.id}.${field}`);
    }
  assert.deepEqual(bad, []);
});

test("reach stays within a plausible range", () => {
  const bad = zones
    .filter((z) => z.reachKm != null && (z.reachKm < 1 || z.reachKm > MAX_REACH_KM))
    .map((z) => `${z.id} (${z.reachKm} km)`);
  assert.deepEqual(bad, []);
});

test("every zone cites at least one resolvable source", () => {
  const bad: string[] = [];
  for (const z of zones) {
    if (!z.citations?.length) {
      bad.push(`${z.id}: no citations`);
      continue;
    }
    for (const c of z.citations) {
      if (!c.ref?.trim()) bad.push(`${z.id}: empty ref`);
      const state = c.url ? resolveUrl(c.url) : "bad";
      if (state !== "ok") bad.push(`${z.id}: ${state} ${c.url ?? "(none)"}`);
    }
  }
  assert.deepEqual(bad, []);
});

test("no two zones share the same coordinates", () => {
  const byPoint = new Map<string, string[]>();
  for (const z of zones) {
    const key = `${z.lat},${z.lng}`;
    byPoint.set(key, [...(byPoint.get(key) ?? []), z.id]);
  }
  const collisions = [...byPoint.entries()]
    .filter(([, ids]) => ids.length > 1)
    .map(([point, ids]) => `${point}: ${ids.join(", ")}`);
  assert.deepEqual(collisions, []);
});

test("near-coincident zones are declared in the fixture", () => {
  const undeclared = pairsWithin(DUPLICATE_KM)
    .filter(([a, b]) => !allowed(NEAR_PAIRS, a, b))
    .map(([a, b, d]) => `${a} <> ${b} (${d.toFixed(1)} km)`);
  assert.deepEqual(undeclared, []);
});

test("stale fixture entries are removed", () => {
  const ids = new Set(zones.map((z) => z.id));
  const stale = [
    ...NEAR_PAIRS.flatMap(([a, b]) => [a, b]),
    ...SIMILAR_NAME_PAIRS.flatMap(([a, b]) => [a, b]),
    ...Object.keys(MARINE_ZONES),
  ].filter((id) => !ids.has(id));
  assert.deepEqual(stale, []);
});

test("similarly named neighbours are declared in the fixture", () => {
  const tokens = zones.map((z) => nameTokens(z.name));
  const undeclared: string[] = [];
  for (let i = 0; i < zones.length; i++)
    for (let j = i + 1; j < zones.length; j++) {
      const d = distanceKm(
        zones[i].lat,
        zones[i].lng,
        zones[j].lat,
        zones[j].lng,
      );
      if (d > SIMILAR_NAME_KM) continue;
      if (similarity(tokens[i], tokens[j]) < SIMILAR_NAME_SCORE) continue;
      if (allowed(SIMILAR_NAME_PAIRS, zones[i].id, zones[j].id)) continue;
      undeclared.push(`${zones[i].id} <> ${zones[j].id} (${d.toFixed(1)} km)`);
    }
  assert.deepEqual(undeclared, []);
});

test("zones sit on land unless declared marine", () => {
  const require = createRequire(import.meta.url);
  const topology = require("world-atlas/land-50m.json");
  const land = feature(topology, topology.objects.land) as never;

  const coastline: number[][] = [];
  (function walk(node: unknown) {
    if (typeof (node as number[])[0] === "number") coastline.push(node as number[]);
    else for (const child of node as unknown[]) walk(child);
  })((land as { features: { geometry: { coordinates: unknown } }[] }).features[0].geometry.coordinates);

  const offshore: string[] = [];
  for (const z of zones) {
    if (MARINE_ZONES[z.id]) continue;
    if (geoContains(land, [z.lng, z.lat])) continue;
    let nearest = Infinity;
    for (const [lng, lat] of coastline) {
      const d = distanceKm(z.lat, z.lng, lat, lng);
      if (d < nearest) nearest = d;
    }
    if (nearest > OFFSHORE_KM)
      offshore.push(`${z.id} (${nearest.toFixed(0)} km from land)`);
  }
  assert.deepEqual(offshore, []);
});
