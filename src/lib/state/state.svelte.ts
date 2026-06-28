import { goto } from "$app/navigation";
import { resolve } from "$app/paths";
import type { MetricKey } from "../data/places/metrics";
import type { Tier, Zone } from "../data/zones/types";

interface UiState {
  hovered: Zone | null;
  selected: Zone | null;
  pointer: { x: number; y: number };
  tiers: Record<Tier, boolean>;
  /** Per-category visibility for the established subcategories. */
  cats: Record<string, boolean>;
  layers: { airQuality: boolean };
  /** Active country metric shown on labels ('none' = off). */
  countryMetric: MetricKey;
  /** Zones whose reach area is pinned visible (by id). */
  pinned: Record<string, boolean>;
  /** Zone ids selected for side-by-side comparison (max a few). */
  compare: string[];
  /** Show every zone's reach area at once. */
  showAllAreas: boolean;
  /** Field opacity multiplier. */
  fieldIntensity: number;
  /** Point-probe target (click empty globe to inspect a location). */
  probe: { lat: number; lng: number } | null;
  /** Camera fly-to request; token forces re-trigger for repeats. dist = target zoom. */
  flyTo: { lat: number; lng: number; token: number; dist?: number } | null;
  showQuestions: boolean;
}

export const ui = $state<UiState>({
  hovered: null,
  selected: null,
  pointer: { x: 0, y: 0 },
  tiers: {
    established: true,
    gray: true,
    solved: true,
    anthropogenic: true,
    conflict: true,
    climate: true,
  },
  cats: {
    radiation: true,
    altitude: true,
    fiber: true,
    chemistry: true,
    airborne: true,
    dietary: true,
    nuclear: true,
    mining: true,
    fossil: true,
    industrial: true,
    waste: true,
  },
  layers: {
    airQuality: false,
  },
  countryMetric: "none",
  pinned: {},
  compare: [],
  showAllAreas: false,
  fieldIntensity: 1,
  probe: null,
  flyTo: null,
  showQuestions: false,
});

let flyCounter = 0;

export function flyToLocation(lat: number, lng: number, dist?: number) {
  flyCounter += 1;
  ui.flyTo = { lat, lng, token: flyCounter, dist };
}

export function openZone(z: Zone) {
  ui.selected = z;
  goto(resolve("/zone/[id]", { id: z.id }));
}

export function togglePin(id: string) {
  if (ui.pinned[id]) delete ui.pinned[id];
  else ui.pinned[id] = true;
}
