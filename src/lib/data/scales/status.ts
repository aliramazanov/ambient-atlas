import type { Zone } from "../zones/types";

export interface Status {
  key: "ongoing" | "open" | "studied" | "solved";
  label: string;
  color: string;
}

const ONGOING: Status = { key: "ongoing", label: "Ongoing", color: "#ff7a59" };

const OPEN: Status = { key: "open", label: "Needs study", color: "#e3c25e" };

const STUDIED: Status = {
  key: "studied",
  label: "Studied, no clear excess",
  color: "#9aa6bd",
};

const SOLVED: Status = { key: "solved", label: "Solved", color: "#5fcf8f" };

export function statusOf(zone: Zone): Status {
  const c = zone.certainty;

  if (zone.tier === "solved" || c === "solved-firm" || c === "solved-debated") {
    return SOLVED;
  }

  if (c === "null-finding") return STUDIED;

  if (
    zone.tier === "gray" ||
    c === "open" ||
    c === "contested" ||
    c === "anecdotal"
  ) {
    return OPEN;
  }

  return ONGOING;
}
