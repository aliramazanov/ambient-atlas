import { anthroSubOf } from "./anthropogenic";
import type { Certainty, Tier, Zone } from "../zones/types";

export { anthroSubOf };

// Anthropogenic (man-made) hazards split into 5 scientifically distinct groups,
// each with its own color and legend toggle.
export const ANTHRO_SUBCATS: {
  key: string;
  label: string;
  color: string;
  desc: string;
}[] = [
  {
    key: "nuclear",
    label: "Nuclear / radioactive",
    color: "#a472f0",
    desc: "Nuclear weapons, reactors, uranium and radioactive-waste sites.",
  },
  {
    key: "mining",
    label: "Mining & metals",
    color: "#c4894c",
    desc: "Mines, smelters, tailings and metallurgical contamination.",
  },
  {
    key: "fossil",
    label: "Fossil fuel",
    color: "#6f8196",
    desc: "Coal, oil and gas extraction, refining and combustion.",
  },
  {
    key: "industrial",
    label: "Industrial / chemical",
    color: "#ef7a93",
    desc: "Chemical plants, solvents, PCBs, pesticides and manufacturing.",
  },
  {
    key: "waste",
    label: "Waste / e-waste",
    color: "#9c8b52",
    desc: "Illegal dumping, landfills, e-waste and open burning.",
  },
];
const ANTHRO_COLOR: Record<string, string> = Object.fromEntries(
  ANTHRO_SUBCATS.map((s) => [s.key, s.color]),
);

export interface CategoryMeta {
  key: string;
  tier: Tier;
  label: string;
  /** Hex color used for the field and the legend swatch. */
  color: string;
  /** Plain-language meaning, shown as a hover tooltip in the legend. */
  desc: string;
}

// A categorical palette of bright pastel hues, spread around the color wheel so
// every category reads as a distinct hue even where many fields overlap. The
// per-zone boundary ring and epicenter dot carry this hue (normal blending), so
// identity survives the additive glow of overlapping fills. Tiers also differ by
// FORM (ring style, see TIER_RING_DASHED) as a non-color backup.
export const CATEGORIES: CategoryMeta[] = [
  {
    key: "radiation",
    tier: "established",
    label: "Radiation / UV",
    color: "#f2c14e",
    desc: "Natural background ionizing radiation (thorium, uranium, radon) and solar ultraviolet.",
  },
  {
    key: "altitude",
    tier: "established",
    label: "Altitude",
    color: "#a99bff",
    desc: "Chronic high-altitude hypoxia (thin air) plus raised cosmic-ray dose.",
  },
  {
    key: "fiber",
    tier: "established",
    label: "Fiber",
    color: "#e98bd0",
    desc: "Natural mineral fibres in local rock (asbestos, erionite) causing lung and pleural disease.",
  },
  {
    key: "chemistry",
    tier: "established",
    label: "Chemistry",
    color: "#62a8f0",
    desc: "Natural geochemistry of water and soil: arsenic, fluoride, selenium, iodine and more.",
  },
  {
    key: "airborne",
    tier: "established",
    label: "Airborne",
    color: "#bcd45f",
    desc: "Natural airborne exposure: mineral dust and volcanic or geothermal gases.",
  },
  {
    key: "dietary",
    tier: "established",
    label: "Dietary",
    color: "#f2926b",
    desc: "Naturally occurring toxins in the local food or water chain (plant, fungal, algal).",
  },
  {
    key: "gray",
    tier: "gray",
    label: "Gray (open question)",
    color: "#aeb8c7",
    desc: "Real exposure with a plausible mechanism, but an open, contested or barely-studied health question.",
  },
  {
    key: "solved",
    tier: "solved",
    label: "Solved",
    color: "#62d49a",
    desc: "A local health mystery whose natural cause was found only after asking why people there were sick.",
  },
  {
    key: "anthropogenic",
    tier: "anthropogenic",
    label: "Anthropogenic",
    color: "#ef7a93",
    desc: "Man-made, not natural: disasters and contamination from human activity (nuclear, industrial, mining, chemical).",
  },
  {
    key: "conflict",
    tier: "conflict",
    label: "Active conflict",
    color: "#f25555",
    desc: "Current or recent armed-conflict zones, clipped to national borders.",
  },
  {
    key: "climate",
    tier: "climate",
    label: "Climate / environmental",
    color: "#4cc7bd",
    desc: "Climate-driven hazards to human life: extreme humid heat, sea-level rise, drought, wildfire smoke, cyclones.",
  },
];

const DESC_BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c.desc]));

// Ring style per tier: dashed rings mark the less-certain or non-geological
// tiers (gray open questions, conflict), readable without relying on hue.
export const TIER_RING_DASHED: Record<Tier, boolean> = {
  established: false,
  gray: true,
  solved: false,
  anthropogenic: false,
  conflict: true,
  climate: false,
};

// Fainter fields for less-certain zones, so confidence reads visually.
export function certaintyOpacity(c?: Certainty): number {
  switch (c) {
    case "anecdotal":
      return 0.5;
    case "contested":
      return 0.7;
    case "open":
      return 0.82;
    default:
      return 1;
  }
}

const COLOR_BY_KEY = new Map(CATEGORIES.map((c) => [c.key, c.color]));

export function categoryColor(zone: Zone): string {
  if (zone.tier === "anthropogenic")
    return ANTHRO_COLOR[anthroSubOf(zone)] ?? "#ef7a93";
  return (
    COLOR_BY_KEY.get(zone.category) ?? COLOR_BY_KEY.get(zone.tier) ?? "#cccccc"
  );
}

export const TIERS: {
  key: Tier;
  label: string;
  defaultOn: boolean;
  desc: string;
}[] = [
  {
    key: "established",
    label: "Established",
    defaultOn: true,
    desc: "Real exposures that are at least partly studied (shown as the six colored categories below).",
  },
  {
    key: "gray",
    label: "Gray (open)",
    defaultOn: true,
    desc: DESC_BY_KEY.get("gray") ?? "",
  },
  {
    key: "solved",
    label: "Solved",
    defaultOn: true,
    desc: DESC_BY_KEY.get("solved") ?? "",
  },
  {
    key: "anthropogenic",
    label: "Anthropogenic",
    defaultOn: true,
    desc: DESC_BY_KEY.get("anthropogenic") ?? "",
  },
  {
    key: "conflict",
    label: "Active conflict",
    defaultOn: true,
    desc: DESC_BY_KEY.get("conflict") ?? "",
  },
  {
    key: "climate",
    label: "Climate / environmental",
    defaultOn: true,
    desc: DESC_BY_KEY.get("climate") ?? "",
  },
];

export const CERTAINTY_LABEL: Record<Certainty, string> = {
  established: "Established",
  "null-finding": "Studied, no clear excess",
  contested: "Contested",
  anecdotal: "Anecdotal, under-studied",
  "acknowledged-late": "Denied then acknowledged",
  "solved-firm": "Solved (firm)",
  "solved-debated": "Solved (mechanism debated)",
  open: "Open question",
};
