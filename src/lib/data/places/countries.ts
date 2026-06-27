import { geoContains } from "d3-geo";
import type { Feature, FeatureCollection, Geometry } from "geojson";
import { feature } from "topojson-client";
import type { GeometryCollection, Topology } from "topojson-specification";
import topo from "world-atlas/countries-50m.json";
import worldCountries from "world-countries";
import { zoneRadiusDeg } from "../scales/reach";
import type { Zone } from "../zones/types";
import { zones } from "../zones/zones";

type CountryProps = { name: string };
export type CountryFeature = Feature<Geometry, CountryProps>;

const topology = topo as object as Topology;

const fc = feature(
  topology,
  topology.objects.countries as GeometryCollection,
) as FeatureCollection<Geometry, CountryProps>;

const byNum = new Map<number, CountryFeature>();
for (const f of fc.features) byNum.set(parseInt(String(f.id), 10), f);

export interface CountryInfo {
  iso3: string;
  name: string;
  feature: CountryFeature;
  zones: Zone[];
}

export function countryByIso3(iso3: string): CountryInfo | null {
  const wc = worldCountries.find((c) => c.cca3 === iso3.toUpperCase());
  if (!wc) return null;

  const feat = byNum.get(parseInt(wc.ccn3, 10));
  if (!feat) return null;

  const inside = zones
    .filter((z) => geoContains(feat, [z.lng, z.lat]))
    .sort((a, b) => zoneRadiusDeg(b) - zoneRadiusDeg(a));

  return { iso3: wc.cca3, name: wc.name.common, feature: feat, zones: inside };
}
