import { angularDistanceDeg } from "$lib/utils/geo";
import { indicatorMeta, indicators } from "../generated/indicators";
import { lifeExpectancy, lifeExpectancyYear } from "../generated/life-expectancy";
import { countryLabels } from "../generated/places";
import { zoneRadiusDeg } from "../scales/reach";
import { zones } from "../zones/zones";

export type MetricKey =
  | "none"
  | "life"
  | "hdi"
  | "income"
  | "gini"
  | "homicide"
  | "calm";

export interface MetricDef {
  key: MetricKey;
  label: string;
  source: string;
  year: string;
  unit: string;
  higherBetter: boolean;
  domain: [number, number];
  map: Record<string, number>;
  format: (v: number) => string;
}

function domainOf(map: Record<string, number>): [number, number] {
  const v = Object.values(map).sort((a, b) => a - b);
  if (!v.length) return [0, 1];
  const p = (q: number) =>
    v[Math.min(v.length - 1, Math.max(0, Math.floor(q * (v.length - 1))))];
  return [p(0.02), p(0.98)];
}

function norm(v: number, [lo, hi]: [number, number]): number {
  if (hi === lo) return 0.5;
  return Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
}

const round1 = (v: number) => v.toFixed(1);
const round3 = (v: number) => v.toFixed(3);
const intFmt = (v: number) => Math.round(v).toLocaleString();

const metrics: MetricDef[] = [];

// Life expectancy (national; cities use sub-national values where available).
metrics.push({
  key: "life",
  label: "Life expectancy",
  source: "World Bank",
  year: lifeExpectancyYear,
  unit: "yr",
  higherBetter: true,
  domain: domainOf(lifeExpectancy),
  map: lifeExpectancy,
  format: round1,
});

// World Bank / UNDP indicators that actually loaded.
const order: { key: MetricKey; fmt: (v: number) => string }[] = [
  { key: "hdi", fmt: round3 },
  { key: "income", fmt: intFmt },
  { key: "gini", fmt: round1 },
  { key: "homicide", fmt: round1 },
];
for (const { key, fmt } of order) {
  const map = indicators[key];
  const meta = indicatorMeta[key];
  if (!map || !meta || !Object.keys(map).length) continue;
  metrics.push({
    key,
    label: meta.label,
    source: meta.source,
    year: meta.year,
    unit: meta.unit,
    higherBetter: meta.higherBetter,
    domain: meta.domain as [number, number],
    map,
    format: fmt,
  });
}

// Composite "calm to live": good-society average minus a hazard penalty drawn
// from nearby zones (natural + man-made + conflict). Centroid-based, so it is a
// coarse highlight, not a precise score.
const lifeDomain = domainOf(lifeExpectancy);
const incLog: [number, number] | null = indicators.income
  ? [
      Math.log10(indicatorMeta.income.domain[0] || 1),
      Math.log10(indicatorMeta.income.domain[1] || 1),
    ]
  : null;

function goodSociety(iso: string): number | null {
  const parts: number[] = [];
  if (lifeExpectancy[iso] != null)
    parts.push(norm(lifeExpectancy[iso], lifeDomain));
  if (indicators.hdi?.[iso] != null)
    parts.push(norm(indicators.hdi[iso], indicatorMeta.hdi.domain));
  if (indicators.income?.[iso] != null && incLog)
    parts.push(norm(Math.log10(indicators.income[iso]), incLog));
  if (indicators.gini?.[iso] != null)
    parts.push(1 - norm(indicators.gini[iso], indicatorMeta.gini.domain));
  if (indicators.homicide?.[iso] != null)
    parts.push(
      1 - norm(indicators.homicide[iso], indicatorMeta.homicide.domain),
    );
  if (!parts.length) return null;
  return parts.reduce((a, b) => a + b, 0) / parts.length;
}

const SEVERITY: Record<string, number> = {
  conflict: 1.0,
  anthropogenic: 0.9,
  climate: 0.8,
  established: 0.65,
  gray: 0.35,
  solved: 0.15,
};

function hazardAt(lat: number, lng: number): number {
  let s = 0;
  for (const z of zones) {
    const w = SEVERITY[z.tier] ?? 0;
    if (!w) continue;
    const rd = zoneRadiusDeg(z) * 1.2;
    const d = angularDistanceDeg(lat, lng, z.lat, z.lng);
    if (d < rd) s += w * (1 - d / rd);
  }
  return s;
}

const calmMap: Record<string, number> = {};
for (const c of countryLabels) {
  const gs = goodSociety(c.iso3);
  if (gs == null) continue;
  const penalty = Math.min(45, hazardAt(c.lat, c.lng) * 10);
  calmMap[c.iso3] = Math.max(0, Math.round(gs * 100 - penalty));
}
metrics.push({
  key: "calm",
  label: "Calm to live (composite)",
  source: "composite",
  year: "",
  unit: "",
  higherBetter: true,
  domain: domainOf(calmMap),
  map: calmMap,
  format: (v) => String(Math.round(v)),
});

export const METRICS = metrics;
export const METRIC_BY_KEY: Record<string, MetricDef> = Object.fromEntries(
  metrics.map((m) => [m.key, m]),
);

// Soft pastel sequential ramp: muted mauve (worse) through lilac, powder blue
// and mint to a pale sage-gold (better). Chosen for a calm, premium country
// fill instead of a saturated data-viz palette. Lightness still rises toward
// "better", so the order survives even desaturated. Keep these stops in sync
// with the legend gradient in the country page (.ramp).
const RAMP: number[][] = [
  [179, 135, 155],
  [177, 153, 189],
  [159, 177, 204],
  [166, 204, 191],
  [210, 220, 171],
];
function rampColor(t: number): string {
  t = Math.max(0, Math.min(1, t));
  const x = t * (RAMP.length - 1);
  const i = Math.floor(x);
  const f = x - i;
  const a = RAMP[i];
  const b = RAMP[Math.min(RAMP.length - 1, i + 1)];
  const c = (k: number) => Math.round(a[k] + (b[k] - a[k]) * f);
  return `rgb(${c(0)}, ${c(1)}, ${c(2)})`;
}

/** Pastel metric color from worse to better, respecting the metric's direction. */
export function metricColor(m: MetricDef, value: number): string {
  let t = norm(value, m.domain);
  if (!m.higherBetter) t = 1 - t;
  return rampColor(t);
}
