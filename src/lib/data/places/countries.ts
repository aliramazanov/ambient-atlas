import { geoContains } from 'd3-geo';
import { feature } from 'topojson-client';
import type { Feature, FeatureCollection, Geometry } from 'geojson';
import type { GeometryCollection, Topology } from 'topojson-specification';
import topo from 'world-atlas/countries-50m.json';
import worldCountries from 'world-countries';
import { zones } from '../zones/zones';
import { zoneRadiusDeg } from '../scales/reach';
import type { Zone } from '../zones/types';

// Country geometry (50m) keyed by numeric M49/ISO id, so an iso3 label on the
// globe can resolve to a polygon and the zones inside it. Imported only by the
// country route, so it is code-split out of the main bundle.
type CountryProps = { name: string };
export type CountryFeature = Feature<Geometry, CountryProps>;

// world-atlas ships a valid TopoJSON topology but without TS types, so the shape
// is asserted once here at the data boundary.
const topology = topo as object as Topology;
const fc = feature(
	topology,
	topology.objects.countries as GeometryCollection
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
	// Zones whose epicenter falls inside the country, largest reach first so big
	// regional fields draw under small local ones.
	const inside = zones
		.filter((z) => geoContains(feat, [z.lng, z.lat]))
		.sort((a, b) => zoneRadiusDeg(b) - zoneRadiusDeg(a));
	return { iso3: wc.cca3, name: wc.name.common, feature: feat, zones: inside };
}
