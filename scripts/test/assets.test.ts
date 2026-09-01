import { geoBounds, geoMercator, geoPath } from "d3-geo";
import type { Feature, FeatureCollection } from "geojson";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const GEO_ASSETS = ["static/ne_rivers.json", "static/ne_lakes.json"] as const;

function load(path: string): FeatureCollection {
  return JSON.parse(readFileSync(path, "utf8")) as FeatureCollection;
}

function describe(path: string, index: number, feature: Feature): string {
  const name = (feature.properties?.name ?? feature.properties?.Name) as
    | string
    | undefined;

  return `${path} feature ${index}${name ? ` (${name})` : ""}`;
}

for (const path of GEO_ASSETS) {
  test(`${path} is a feature collection with geometry on every feature`, () => {
    const fc = load(path);
    assert.equal(fc.type, "FeatureCollection");
    assert.ok(fc.features.length > 0);

    const broken = fc.features
      .map((f, i) => ({ f, i }))
      .filter(({ f }) => {
        if (!f.geometry || !("coordinates" in f.geometry)) return true;
        const coords = f.geometry.coordinates as unknown[];
        return !Array.isArray(coords) || coords.some((part) => part == null);
      })
      .map(({ f, i }) => describe(path, i, f));

    assert.deepEqual(broken, []);
  });

  test(`${path} survives the projection pipeline the country page uses`, () => {
    const fc = load(path);
    const render = geoPath(geoMercator());
    const failures: string[] = [];

    for (const [i, feature] of fc.features.entries()) {
      try {
        geoBounds(feature);
        render(feature);
      } catch (err) {
        failures.push(
          `${describe(path, i, feature)}: ${err instanceof Error ? err.message : String(err)}`,
        );
      }
    }

    assert.deepEqual(failures, []);
  });

  test(`${path} coordinates are finite and in range`, () => {
    const fc = load(path);
    const bad: string[] = [];

    for (const [i, feature] of fc.features.entries()) {
      const [[w, s], [e, n]] = geoBounds(feature);

      if (![w, s, e, n].every(Number.isFinite)) {
        bad.push(`${describe(path, i, feature)}: non-finite bounds`);
        continue;
      }

      if (s < -90 || n > 90 || w < -180 || e > 180)
        bad.push(`${describe(path, i, feature)}: bounds out of range`);
    }

    assert.deepEqual(bad, []);
  });
}
