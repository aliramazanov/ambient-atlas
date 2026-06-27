import type { MetricKey } from "../data/places/metrics";
import type { Tier } from "../data/zones/types";
import { ui } from "./state.svelte";

// Persist the shareable view (layers, metric, intensity, air quality, pinned
// zones) in the URL query so a globe view can be linked. Transient state
// (hover, selection, probe) is not encoded.

const TIER_KEYS: Tier[] = [
  "established",
  "gray",
  "solved",
  "anthropogenic",
  "conflict",
  "climate",
];

function setOrDelete(p: URLSearchParams, key: string, value: string) {
  if (value) p.set(key, value);
  else p.delete(key);
}

export function readUrlState(): void {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);

  const off = (p.get("off") ?? "").split(",").filter(Boolean);
  for (const t of TIER_KEYS) ui.tiers[t] = !off.includes(t);

  const m = p.get("m");
  if (m) ui.countryMetric = m as MetricKey;

  if (p.get("all") === "1") ui.showAllAreas = true;

  const fi = p.get("fi");
  if (fi) {
    const n = parseFloat(fi);
    if (!Number.isNaN(n)) ui.fieldIntensity = n;
  }

  ui.layers.airQuality = p.get("aq") === "1";

  const pins = (p.get("pin") ?? "").split(",").filter(Boolean);
  if (pins.length) ui.pinned = Object.fromEntries(pins.map((id) => [id, true]));
}

export function writeUrlState(): void {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);

  const off = TIER_KEYS.filter((t) => !ui.tiers[t]).join(",");
  setOrDelete(p, "off", off);
  setOrDelete(p, "m", ui.countryMetric === "none" ? "" : ui.countryMetric);
  setOrDelete(p, "all", ui.showAllAreas ? "1" : "");
  setOrDelete(
    p,
    "fi",
    ui.fieldIntensity === 1 ? "" : String(ui.fieldIntensity),
  );
  setOrDelete(p, "aq", ui.layers.airQuality ? "1" : "");
  setOrDelete(
    p,
    "pin",
    Object.keys(ui.pinned)
      .filter((id) => ui.pinned[id])
      .join(","),
  );

  const qs = p.toString();
  const url = qs
    ? `${window.location.pathname}?${qs}`
    : window.location.pathname;
  window.history.replaceState(window.history.state, "", url);
}
