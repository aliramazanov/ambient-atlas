// Rank cities by distance from every mapped zone, then by society indicators.
// Run with type stripping: node --experimental-strip-types scripts/generate-livable.ts
// List A: clear of ALL mapped phenomena (established + gray + man-made + conflict).
// List B: clear of serious hazards (no established, man-made or conflict), gray
//   tolerated, ranked by society indicators (highest livability with low risk).
import { writeFileSync } from 'node:fs';
import allCitiesPkg from 'all-the-cities';
import countriesPkg from 'world-countries';
import { zones } from '../../src/lib/data/zones/zones.ts';
import { zoneRadiusDeg } from '../../src/lib/data/scales/reach.ts';
import { lifeExpectancy } from '../../src/lib/data/generated/life-expectancy.ts';
import { indicators, indicatorMeta } from '../../src/lib/data/generated/indicators.ts';

const allCities = (allCitiesPkg.default ?? allCitiesPkg).slice().sort((a, b) => b.population - a.population);
const countries = countriesPkg.default ?? countriesPkg;

const iso2to3 = new Map();
const iso3name = new Map();
for (const c of countries) {
	if (c.cca2 && c.cca3) {
		iso2to3.set(c.cca2.toUpperCase(), c.cca3);
		iso3name.set(c.cca3, c.name.common);
	}
}

function angDeg(la1, lo1, la2, lo2) {
	const r = Math.PI / 180;
	const a1 = la1 * r;
	const a2 = la2 * r;
	const dl = (lo2 - lo1) * r;
	const c = Math.sin(a1) * Math.sin(a2) + Math.cos(a1) * Math.cos(a2) * Math.cos(dl);
	return (Math.acos(Math.max(-1, Math.min(1, c))) * 180) / Math.PI;
}

const zoneInfo = zones.map((z) => ({ lat: z.lat, lng: z.lng, rd: zoneRadiusDeg(z), tier: z.tier, name: z.name }));

function exposure(lat, lng) {
	const est = [];
	const gray = [];
	const man = [];
	const conflict = [];
	let natMargin = Infinity;
	for (const z of zoneInfo) {
		const d = angDeg(lat, lng, z.lat, z.lng);
		if (z.tier === 'established' || z.tier === 'gray') natMargin = Math.min(natMargin, d - z.rd);
		if (d <= z.rd) {
			if (z.tier === 'established') est.push(z.name);
			else if (z.tier === 'gray') gray.push(z.name);
			else if (z.tier === 'anthropogenic') man.push(z.name);
			else if (z.tier === 'conflict') conflict.push(z.name);
		}
	}
	// UV is a latitude gradient, not a circle: low and mid latitudes carry high
	// ambient solar UV (and melanoma burden is high even to ~35-40 degrees in
	// fair-skinned populations), so treat it as an established hazard to ~35.
	if (Math.abs(lat) <= 35) est.push('High ambient UV (low/mid latitude)');
	return { est, gray, man, conflict, natMargin };
}

function dom(map) {
	const v = Object.values(map).sort((a, b) => a - b);
	const p = (q) => v[Math.max(0, Math.min(v.length - 1, Math.floor(q * (v.length - 1))))];
	return [p(0.02), p(0.98)];
}
function norm(v, [lo, hi]) {
	if (hi === lo) return 0.5;
	return Math.max(0, Math.min(1, (v - lo) / (hi - lo)));
}
const leDom = dom(lifeExpectancy);
const incDom = indicators.income
	? [Math.log10(indicatorMeta.income.domain[0] || 1), Math.log10(indicatorMeta.income.domain[1] || 1)]
	: null;

function society(iso) {
	const parts = [];
	if (lifeExpectancy[iso] != null) parts.push(norm(lifeExpectancy[iso], leDom));
	if (indicators.hdi?.[iso] != null) parts.push(norm(indicators.hdi[iso], indicatorMeta.hdi.domain));
	if (indicators.income?.[iso] != null && incDom) parts.push(norm(Math.log10(indicators.income[iso]), incDom));
	if (indicators.gini?.[iso] != null) parts.push(1 - norm(indicators.gini[iso], indicatorMeta.gini.domain));
	if (indicators.homicide?.[iso] != null) parts.push(1 - norm(indicators.homicide[iso], indicatorMeta.homicide.domain));
	if (!parts.length) return null;
	return parts.reduce((a, b) => a + b, 0) / parts.length;
}

const MINPOP = 300000;
const seen = new Set();
const cands = [];
for (const c of allCities) {
	if (c.population < MINPOP) continue;
	const iso3 = iso2to3.get((c.country || '').toUpperCase());
	if (!iso3) continue;
	const key = `${c.name.toLowerCase()}|${iso3}`;
	if (seen.has(key)) continue;
	seen.add(key);
	const lat = c.loc.coordinates[1];
	const lng = c.loc.coordinates[0];
	const soc = society(iso3);
	if (soc == null || lifeExpectancy[iso3] == null) continue;
	const ex = exposure(lat, lng);
	cands.push({
		name: c.name,
		country: iso3name.get(iso3) || iso3,
		lat: +lat.toFixed(2),
		lng: +lng.toFixed(2),
		le: lifeExpectancy[iso3],
		score: Math.round(soc * 100),
		est: ex.est,
		gray: ex.gray,
		man: ex.man,
		conflict: ex.conflict,
		margin: Math.round(ex.natMargin * 10) / 10
	});
}

// Collapse near-duplicate cities (suburbs, alternative names) within ~0.5 degrees,
// keeping the largest. Candidates are already in descending population order.
const dedup = [];
for (const c of cands) {
	if (dedup.some((d) => angDeg(c.lat, c.lng, d.lat, d.lng) < 0.5)) continue;
	dedup.push(c);
}

// List A: clear of everything mapped, ranked by life expectancy then society.
const listA = dedup
	.filter((c) => !c.est.length && !c.gray.length && !c.man.length && !c.conflict.length)
	.sort((a, b) => b.le - a.le || b.score - a.score || b.margin - a.margin)
	.slice(0, 30);

// List B: no serious hazard (gray tolerated), ranked by society then life expectancy.
const listB = dedup
	.filter((c) => !c.est.length && !c.man.length && !c.conflict.length)
	.sort((a, b) => b.score - a.score || b.le - a.le)
	.slice(0, 30);

// Collapse the several overlapping radon belts into one honest label.
function cleanGray(gray) {
	const out = [];
	let radon = false;
	for (const g of gray) {
		if (/radon/i.test(g)) radon = true;
		else out.push(g);
	}
	if (radon) out.unshift('Radon-prone terrain');
	return out;
}

const trim = (c) => ({
	name: c.name,
	country: c.country,
	lat: c.lat,
	lng: c.lng,
	le: c.le,
	score: c.score,
	gray: cleanGray(c.gray)
});

const out =
	`// AUTO-GENERATED by scripts/generate/livable.ts. Do not edit by hand.\n` +
	`// Cities (pop >= ${MINPOP}) ranked by geodesic distance from mapped zones, then society indicators.\n` +
	`export interface LivableCity { name: string; country: string; lat: number; lng: number; le: number; score: number; gray: string[] }\n` +
	`export const clearCities: LivableCity[] = ${JSON.stringify(listA.map(trim))};\n` +
	`export const lowRiskHighScore: LivableCity[] = ${JSON.stringify(listB.map(trim))};\n`;

writeFileSync('src/lib/data/generated/livable.ts', out);
console.log(
	`Candidates ${cands.length}, after dedup ${dedup.length}. List A (fully clear) ${listA.length}, List B (low-risk) ${listB.length}.`
);
