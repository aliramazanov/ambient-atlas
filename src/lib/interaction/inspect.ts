import { cities, countryLabels } from "$lib/data/generated/places";
import { METRICS } from "$lib/data/places/metrics";
import { zoneRadiusDeg } from "$lib/data/scales/reach";
import type { Tier } from "$lib/data/zones/types";
import { zones } from "$lib/data/zones/zones";
import { angularDistanceDeg } from "$lib/utils/geo";
import { clipFor } from "./conflict-clip";

const SEVERITY: Record<Tier, number> = {
  conflict: 5,
  anthropogenic: 4,
  climate: 4,
  established: 3,
  gray: 2,
  solved: 1,
};

interface CountryMetric {
  label: string;
  value: string;
  unit: string;
}

export interface InspectResult {
  zones: {
    name: string;
    tier: Tier;
    category: string;
    distDeg: number;
    rd: number;
  }[];
  cities: { name: string; distKm: number }[];
  country: { name: string; iso3: string; metrics: CountryMetric[] } | null;
}

type ZoneHit = InspectResult["zones"][number] & { sev: number };

export function inspectLocation(lat: number, lng: number): InspectResult {
  const zoneHits: ZoneHit[] = [];

  for (const z of zones) {
    const clip = clipFor(z.id);

    if (clip) {
      if (clip(lat, lng)) {
        zoneHits.push({
          name: z.name,
          tier: z.tier,
          category: z.category,
          distDeg: 0,
          rd: 0,
          sev: SEVERITY[z.tier] ?? 0,
        });
      }
      continue;
    }

    const rd = zoneRadiusDeg(z);

    const d = angularDistanceDeg(lat, lng, z.lat, z.lng);

    if (d <= rd) {
      zoneHits.push({
        name: z.name,
        tier: z.tier,
        category: z.category,
        distDeg: Math.round(d * 10) / 10,
        rd: Math.round(rd * 10) / 10,
        sev: SEVERITY[z.tier] ?? 0,
      });
    }
  }

  if (Math.abs(lat) <= 35) {
    zoneHits.push({
      name: "High ambient UV (low/mid latitude)",
      tier: "established" as Tier,
      category: "radiation",
      distDeg: 0,
      rd: 0,
      sev: SEVERITY.established,
    });
  }

  zoneHits.sort((a, b) => b.sev - a.sev || a.distDeg - b.distDeg);

  const nearCities = cities
    .map((c) => ({
      name: c.name,
      d: angularDistanceDeg(lat, lng, c.lat, c.lng),
    }))
    .sort((a, b) => a.d - b.d)
    .slice(0, 3)
    .map((c) => ({ name: c.name, distKm: Math.round(c.d * 111) }));

  let best: (typeof countryLabels)[number] | null = null;
  let bestD = Infinity;

  for (const c of countryLabels) {
    const d = angularDistanceDeg(lat, lng, c.lat, c.lng);

    if (d < bestD) {
      bestD = d;
      best = c;
    }
  }

  let country: InspectResult["country"] = null;

  if (best) {
    const metrics: CountryMetric[] = [];

    for (const m of METRICS) {
      if (m.key === "calm") continue;
      const v = m.map[best.iso3];

      if (v != null)
        metrics.push({ label: m.label, value: m.format(v), unit: m.unit });
    }

    country = { name: best.name, iso3: best.iso3, metrics };
  }

  return {
    zones: zoneHits.map(({ name, tier, category, distDeg, rd }) => ({
      name,
      tier,
      category,
      distDeg,
      rd,
    })),

    cities: nearCities,

    country,
  };
}
