import type { Certainty, Zone } from '../zones/types';

// Research depth derives from how settled the health question is, unless a zone
// sets an explicit value.
const RESEARCH: Record<Certainty, number> = {
	established: 5,
	'null-finding': 5,
	'solved-firm': 5,
	'solved-debated': 4,
	'acknowledged-late': 4,
	contested: 3,
	open: 2,
	anecdotal: 1
};

// Health severity defaults by category (the kind of harm), then tier.
const SEV_CATEGORY: Record<string, number> = {
	radiation: 3,
	altitude: 2,
	fiber: 5,
	chemistry: 4,
	airborne: 3,
	dietary: 4
};
const SEV_TIER: Record<string, number> = {
	gray: 2,
	solved: 4,
	anthropogenic: 4,
	conflict: 5,
	established: 3,
	climate: 4
};

/** Indicative 1-5 health severity (explicit value wins, else a heuristic). */
export function severityOf(z: Zone): number {
	return z.severity ?? SEV_CATEGORY[z.category] ?? SEV_TIER[z.tier] ?? 3;
}

/** Indicative 1-5 research depth (explicit value wins, else from certainty). */
export function researchOf(z: Zone): number {
	return z.research ?? (z.certainty ? RESEARCH[z.certainty] : 3);
}

/** Filled/empty dots for a 1-5 rating, for compact display. */
export function dots(n: number, max = 5): string {
	const f = Math.max(0, Math.min(max, Math.round(n)));
	return '●'.repeat(f) + '○'.repeat(max - f);
}
