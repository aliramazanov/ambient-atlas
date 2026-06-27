// Insert researched zone candidates (JSON) into src/lib/data/zones/zones.ts as typed
// literals. Reusable across regional research batches.
//   node scripts/insert-zones.ts <candidates.json> "<Section header>"
import { readFileSync, writeFileSync } from 'node:fs';

const [, , jsonPath, headerArg] = process.argv;
if (!jsonPath) {
	console.error('usage: node scripts/insert-zones.ts <candidates.json> "<header>"');
	process.exit(1);
}
const header = headerArg ?? 'PER-COUNTRY SWEEP';
const ZONES = 'src/lib/data/zones/zones.ts';
const MARKER = '\t// ===================== EXPANSION 8: EUROPE / ANATOLIA GAPS';

const candidates = JSON.parse(readFileSync(jsonPath, 'utf8'));
let src = readFileSync(ZONES, 'utf8');

const clean = (s) => String(s).replace(/—/g, ', ').replace(/–/g, '-');
const J = (s) => JSON.stringify(clean(s));
const certaintyFor = (t) => (t === 'gray' ? 'open' : t === 'solved' ? 'solved-firm' : 'established');

let inserted = 0;
let skipped = 0;
const lines = [];
for (const z of candidates) {
	if (src.includes(`id: '${z.id}'`) || src.includes(`id: "${z.id}"`)) {
		skipped++;
		continue;
	}
	const c = z.citation;
	const emission = z.emissionType ? ` emissionType: ${J(z.emissionType)},` : '';
	lines.push(
		`\t{ id: ${J(z.id)}, name: ${J(z.name)}, tier: ${J(z.tier)}, category: ${J(z.category)}, ` +
			`lat: ${z.lat}, lng: ${z.lng}, r: ${z.reachKm}, reachKm: ${z.reachKm}, ` +
			`certainty: ${J(z.certainty ?? certaintyFor(z.tier))}, severity: ${z.severity}, research: ${z.research},${emission} ` +
			`desc: ${J(z.desc)}, health: ${J(z.health)}, ` +
			`citations: [{ type: ${J(c.type)}, ref: ${J(c.ref)}, url: ${J(c.url)}, openAccess: ${!!c.openAccess} }] },`
	);
	inserted++;
}

if (!lines.length) {
	console.log(`Nothing to insert (skipped ${skipped} existing).`);
	process.exit(0);
}

const idx = src.indexOf(MARKER);
if (idx === -1) {
	console.error('marker not found in zones.ts');
	process.exit(1);
}
const block = `\t// ===================== ${header} =====================\n${lines.join('\n')}\n\n`;
src = src.slice(0, idx) + block + src.slice(idx);
writeFileSync(ZONES, src);
console.log(`Inserted ${inserted} zones, skipped ${skipped} existing.`);
