export type PairException = readonly [string, string, string];

export const NEAR_PAIRS: readonly PairException[] = [
  [
    "zabrat-lake",
    "binagadi-lake",
    "Two separate Absheron oil lakes surveyed individually by the UNIDO TSIP report.",
  ],
  [
    "jakarta-subsidence",
    "indonesia-cough-syrup-deg",
    "Same city, unrelated hazards: land subsidence and a diethylene-glycol poisoning.",
  ],
  [
    "bulbula-lake",
    "absheron-oilfield-norm",
    "A contaminated lake inside the wider Absheron NORM oilfield, distinct sources.",
  ],
  [
    "bulbula-lake",
    "baku-iodine-bromine-norm",
    "A contaminated lake beside the iodine-bromine plant, distinct sources.",
  ],
  [
    "campi-flegrei",
    "bagnoli-italsider-brownfield",
    "Volcanic degassing caldera and a steel brownfield that happen to overlap.",
  ],
];

export const SIMILAR_NAME_PAIRS: readonly PairException[] = [
  [
    "metaleurop-nord-noyelles-godault",
    "mortagne-du-nord-smelter",
    "Two different lead-zinc smelters in the Nord region, similarly named.",
  ],
];

export const MARINE_ZONES: Readonly<Record<string, string>> = {
  "bay-of-bengal-cyclones": "Cyclone track centred over open water.",
  "deepwater-horizon-corexit": "Offshore spill and dispersant application site.",
  enewetak: "Pacific atoll, below the resolution of the 50m coastline.",
  "gulf-mexico-deadzone": "Offshore hypoxic zone.",
  "johnston-atoll": "Pacific atoll, below the resolution of the 50m coastline.",
  "k19-submarine": "Reactor accident aboard a submarine at sea.",
  "k278-komsomolets": "Submarine wreck on the floor of the Norwegian Sea.",
  "marshall-islands": "Pacific atolls, below the resolution of the 50m coastline.",
  "montebello-islands": "Island group, below the resolution of the 50m coastline.",
  mururoa: "French Polynesian atoll, below the resolution of the 50m coastline.",
  "persian-gulf-heat": "Humid-heat zone centred over the Gulf itself.",
  "saharan-atlantic": "Dust corridor over the Atlantic.",
  "uss-scorpion": "Submarine wreck on the floor of the mid-Atlantic.",
  "vela-incident-1979": "Unattributed flash over the open South Atlantic.",
};
