import { feature } from 'topojson-client';
import { geoContains } from 'd3-geo';
import countries110 from 'world-atlas/countries-110m.json';
import type { Topology, GeometryCollection } from 'topojson-specification';

interface CountryProps {
	name: string;
}

const topology = countries110 as unknown as Topology;
const worldFC = feature(
	topology,
	topology.objects.countries as GeometryCollection<CountryProps>
);
type CountryFeature = (typeof worldFC.features)[number];

const byName = new Map<string, CountryFeature>();
for (const f of worldFC.features) byName.set(f.properties.name, f);

// Conflict zones are confined to these countries (Natural Earth names), for both
// rendering (clip the field) and hit-testing (only hover inside the border).
export const CONFLICT_COUNTRIES: Record<string, string[]> = {
	'conflict-ukraine': ['Ukraine'],
	'conflict-gaza': ['Palestine'],
	'conflict-sudan': ['Sudan'],
	'conflict-myanmar': ['Myanmar'],
	'conflict-sahel': ['Mali', 'Burkina Faso', 'Niger'],
	'conflict-drc': ['Dem. Rep. Congo'],
	'conflict-yemen': ['Yemen'],
	'conflict-somalia': ['Somalia'],
	'conflict-syria': ['Syria'],
	'conflict-haiti': ['Haiti']
};

const featsFor = new Map<string, CountryFeature[]>();
for (const [id, names] of Object.entries(CONFLICT_COUNTRIES)) {
	featsFor.set(
		id,
		names.map((n) => byName.get(n)).filter((f): f is CountryFeature => f != null)
	);
}

/** A containment predicate for a clipped (conflict) zone, or null if not clipped. */
export function clipFor(id: string): ((lat: number, lng: number) => boolean) | null {
	const fs = featsFor.get(id);
	if (!fs || !fs.length) return null;
	return (lat, lng) => fs.some((f) => geoContains(f, [lng, lat]));
}
