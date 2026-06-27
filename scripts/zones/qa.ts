// One-off QA sweep over the zone dataset: near-duplicates, over-broad reach,
// missing fields, bad coordinates, category/tier mismatches, stray dashes.
import { zones } from '../../src/lib/data/zones/zones.ts';
import { zoneRadiusDeg, reachKm } from '../../src/lib/data/scales/reach.ts';

const EST_CATS = new Set(['radiation', 'altitude', 'fiber', 'chemistry', 'airborne', 'dietary']);
const TIER_CAT = { gray: 'gray', solved: 'solved', anthropogenic: 'anthropogenic', conflict: 'conflict', climate: 'climate' };

function angKm(a, b) {
	const R = Math.PI / 180;
	const dLat = (b.lat - a.lat) * R;
	const dLng = (b.lng - a.lng) * R;
	const la1 = a.lat * R, la2 = b.lat * R;
	const h = Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
	return 2 * 6371 * Math.asin(Math.min(1, Math.sqrt(h)));
}

const ids = new Map();
const dupeIds = [];
const badCoords = [];
const badCat = [];
const missing = [];
const dashes = [];
for (const z of zones) {
	if (ids.has(z.id)) dupeIds.push(z.id);
	ids.set(z.id, z);
	if (!(z.lat >= -90 && z.lat <= 90 && z.lng >= -180 && z.lng <= 180)) badCoords.push(z.id);
	const okCat = z.tier === 'established' ? EST_CATS.has(z.category) : z.category === TIER_CAT[z.tier];
	if (!okCat) badCat.push(`${z.id} (tier=${z.tier} cat=${z.category})`);
	if (!z.citations || !z.citations.length) missing.push(`${z.id}: no citations`);
	for (const f of ['name', 'desc']) if (!z[f]) missing.push(`${z.id}: no ${f}`);
	for (const f of ['name', 'desc', 'health']) {
		const v = z[f];
		if (typeof v === 'string' && /[—–]/.test(v)) dashes.push(`${z.id}.${f}`);
	}
}

// Over-broad reach (degrees).
const broad = zones
	.map((z) => ({ id: z.id, deg: +zoneRadiusDeg(z).toFixed(1), km: reachKm(z) }))
	.filter((z) => z.deg >= 15)
	.sort((a, b) => b.deg - a.deg);

// Near-duplicate pairs (centers within 60 km).
const near = [];
for (let i = 0; i < zones.length; i++) {
	for (let j = i + 1; j < zones.length; j++) {
		const d = angKm(zones[i], zones[j]);
		if (d < 60) near.push({ d: Math.round(d), a: zones[i], b: zones[j] });
	}
}
near.sort((x, y) => x.d - y.d);

console.log(`TOTAL ${zones.length} zones\n`);
console.log(`Duplicate ids: ${dupeIds.length ? dupeIds.join(', ') : 'none'}`);
console.log(`Bad coordinates: ${badCoords.length ? badCoords.join(', ') : 'none'}`);
console.log(`Category/tier mismatch: ${badCat.length ? badCat.join('; ') : 'none'}`);
console.log(`Missing fields: ${missing.length ? missing.join('; ') : 'none'}`);
console.log(`Em/en dashes in text: ${dashes.length ? dashes.join(', ') : 'none'}`);
console.log(`\nOver-broad reach (>= 15 deg), ${broad.length}:`);
for (const b of broad) console.log(`  ${b.deg}deg (${b.km}km)  ${b.id}`);
console.log(`\nNear-duplicate pairs (< 60 km), ${near.length}:`);
for (const n of near) console.log(`  ${n.d}km  ${n.a.id} [${n.a.category}] <> ${n.b.id} [${n.b.category}]`);
